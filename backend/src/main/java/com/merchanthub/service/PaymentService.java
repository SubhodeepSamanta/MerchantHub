package com.merchanthub.service;

import com.merchanthub.dto.CreatePaymentRequest;
import com.merchanthub.dto.PageResponse;
import com.merchanthub.dto.PaymentResponse;
import com.merchanthub.dto.PaymentResult;
import com.merchanthub.entity.AdvanceStatus;
import com.merchanthub.entity.CashAdvance;
import com.merchanthub.entity.LedgerReason;
import com.merchanthub.entity.Merchant;
import com.merchanthub.entity.Payment;
import com.merchanthub.entity.PaymentStatus;
import com.merchanthub.exception.BusinessRuleException;
import com.merchanthub.exception.ResourceNotFoundException;
import com.merchanthub.repository.CashAdvanceRepository;
import com.merchanthub.repository.MerchantRepository;
import com.merchanthub.repository.PaymentRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.merchanthub.entity.LedgerEntry;
import com.merchanthub.repository.LedgerEntryRepository;

@Service
public class PaymentService {

  private final PaymentRepository paymentRepository;
  private final MerchantRepository merchantRepository;
  private final WalletService walletService;
  private final CashAdvanceRepository cashAdvanceRepository;
  private final LedgerEntryRepository ledgerEntryRepository;

  public PaymentService(
      PaymentRepository paymentRepository,
      MerchantRepository merchantRepository,
      WalletService walletService,
      CashAdvanceRepository cashAdvanceRepository,
      LedgerEntryRepository ledgerEntryRepository
  ) {
    this.paymentRepository = paymentRepository;
    this.merchantRepository = merchantRepository;
    this.walletService = walletService;
    this.cashAdvanceRepository = cashAdvanceRepository;
    this.ledgerEntryRepository = ledgerEntryRepository;
  }

  @Transactional
  public PaymentResult processPayment(Long merchantId, String idempotencyKey, CreatePaymentRequest request) {
    return processPayment(merchantId, idempotencyKey, request, LocalDateTime.now());
  }

  @Transactional
  public PaymentResult processPayment(
      Long merchantId,
      String idempotencyKey,
      CreatePaymentRequest request,
      LocalDateTime timestamp
  ) {
    Optional<Payment> existing = paymentRepository.findByMerchantIdAndIdempotencyKey(merchantId, idempotencyKey);
    if (existing.isPresent()) {
      return new PaymentResult(PaymentResponse.from(existing.get()), false);
    }

    Merchant merchant = merchantRepository.findById(merchantId)
        .orElseThrow(() -> new ResourceNotFoundException("Merchant not found"));

    PaymentStatus status = request.payerVpa().toLowerCase().contains("fail")
        ? PaymentStatus.FAILED
        : PaymentStatus.SUCCESS;

    Payment payment = new Payment();
    payment.setMerchant(merchant);
    payment.setPayerVpa(request.payerVpa().trim());
    payment.setAmount(request.amount().setScale(2, RoundingMode.HALF_UP));
    payment.setNote(request.note() != null ? request.note().trim() : null);
    payment.setStatus(status);
    payment.setIdempotencyKey(idempotencyKey);
    payment.setCreatedAt(timestamp);

    Payment savedPayment;
    try {
      savedPayment = paymentRepository.saveAndFlush(payment);
    } catch (DataIntegrityViolationException e) {
      Payment raceExisting = paymentRepository.findByMerchantIdAndIdempotencyKey(merchantId, idempotencyKey)
          .orElseThrow(() -> e);
      return new PaymentResult(PaymentResponse.from(raceExisting), false);
    }

    if (status == PaymentStatus.SUCCESS) {
      walletService.credit(merchantId, savedPayment.getAmount(), LedgerReason.PAYMENT, savedPayment.getId(), timestamp);

      Optional<CashAdvance> activeAdvanceOpt = cashAdvanceRepository
          .findByMerchantIdAndStatus(merchantId, AdvanceStatus.ACTIVE);

      if (activeAdvanceOpt.isPresent()) {
        CashAdvance advance = activeAdvanceOpt.get();
        BigDecimal tenPercent = savedPayment.getAmount().multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal outstanding = advance.getOutstanding();
        BigDecimal repayment = tenPercent.min(outstanding).setScale(2, RoundingMode.HALF_UP);

        if (repayment.compareTo(BigDecimal.ZERO) > 0) {
          walletService.debit(merchantId, repayment, LedgerReason.ADVANCE_REPAYMENT, savedPayment.getId(), timestamp);

          BigDecimal newAmountRepaid = advance.getAmountRepaid().add(repayment).setScale(2, RoundingMode.HALF_UP);
          advance.setAmountRepaid(newAmountRepaid);
          if (newAmountRepaid.compareTo(advance.getTotalRepayable()) >= 0) {
            advance.setStatus(AdvanceStatus.REPAID);
          }
          cashAdvanceRepository.save(advance);
        }
      }
    }

    return new PaymentResult(PaymentResponse.from(savedPayment), true);
  }

  public PageResponse<PaymentResponse> getPayments(Long merchantId, int page, int size, PaymentStatus status) {
    int effectiveSize = Math.min(Math.max(size, 1), 100);
    Pageable pageable = PageRequest.of(Math.max(page, 0), effectiveSize);

    Page<Payment> paymentPage;
    if (status != null) {
      paymentPage = paymentRepository.findByMerchantIdAndStatusOrderByCreatedAtDescIdDesc(merchantId, status, pageable);
    } else {
      paymentPage = paymentRepository.findByMerchantIdOrderByCreatedAtDescIdDesc(merchantId, pageable);
    }

    return PageResponse.from(paymentPage, PaymentResponse::from);
  }

  public PaymentResponse getPayment(Long merchantId, Long paymentId) {
    Payment payment = paymentRepository.findByIdAndMerchantId(paymentId, merchantId)
        .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
    return PaymentResponse.from(payment);
  }

  @Transactional
  public PaymentResponse refundPayment(Long merchantId, Long paymentId) {
    Payment payment = paymentRepository.findByIdAndMerchantId(paymentId, merchantId)
        .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

    if (payment.getStatus() != PaymentStatus.SUCCESS) {
      throw new BusinessRuleException("Only successful payments can be refunded");
    }

    Optional<LedgerEntry> repaymentEntryOpt = ledgerEntryRepository
        .findFirstByReferenceIdAndReason(payment.getId(), LedgerReason.ADVANCE_REPAYMENT);

    if (repaymentEntryOpt.isPresent()) {
      BigDecimal repayment = repaymentEntryOpt.get().getAmount();

      Optional<CashAdvance> advanceOpt = cashAdvanceRepository
          .findByMerchantIdAndStatus(merchantId, AdvanceStatus.ACTIVE)
          .or(() -> cashAdvanceRepository.findByMerchantIdOrderByCreatedAtDescIdDesc(merchantId).stream().findFirst());

      if (advanceOpt.isPresent()) {
        CashAdvance advance = advanceOpt.get();
        BigDecimal newRepaid = advance.getAmountRepaid().subtract(repayment).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        advance.setAmountRepaid(newRepaid);
        if (newRepaid.compareTo(advance.getTotalRepayable()) < 0) {
          advance.setStatus(AdvanceStatus.ACTIVE);
        }
        cashAdvanceRepository.save(advance);
      }

      walletService.credit(merchantId, repayment, LedgerReason.ADVANCE_REPAYMENT, payment.getId());
    }

    walletService.debit(merchantId, payment.getAmount(), LedgerReason.REFUND, payment.getId());
    payment.setStatus(PaymentStatus.REFUNDED);
    Payment saved = paymentRepository.save(payment);

    return PaymentResponse.from(saved);
  }
}
