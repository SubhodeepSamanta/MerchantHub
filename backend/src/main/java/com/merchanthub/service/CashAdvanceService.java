package com.merchanthub.service;

import com.merchanthub.dto.AdvanceEligibilityResponse;
import com.merchanthub.dto.ApplyAdvanceRequest;
import com.merchanthub.dto.CashAdvanceResponse;
import com.merchanthub.entity.AdvanceStatus;
import com.merchanthub.entity.CashAdvance;
import com.merchanthub.entity.LedgerReason;
import com.merchanthub.entity.Merchant;
import com.merchanthub.entity.PaymentStatus;
import com.merchanthub.exception.BusinessRuleException;
import com.merchanthub.exception.ResourceNotFoundException;
import com.merchanthub.repository.CashAdvanceRepository;
import com.merchanthub.repository.MerchantRepository;
import com.merchanthub.repository.PaymentRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CashAdvanceService {

  private final CashAdvanceRepository cashAdvanceRepository;
  private final PaymentRepository paymentRepository;
  private final MerchantRepository merchantRepository;
  private final WalletService walletService;

  public CashAdvanceService(
      CashAdvanceRepository cashAdvanceRepository,
      PaymentRepository paymentRepository,
      MerchantRepository merchantRepository,
      WalletService walletService
  ) {
    this.cashAdvanceRepository = cashAdvanceRepository;
    this.paymentRepository = paymentRepository;
    this.merchantRepository = merchantRepository;
    this.walletService = walletService;
  }

  public AdvanceEligibilityResponse checkEligibility(Long merchantId) {
    LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);

    long successfulPayments = paymentRepository.countByMerchantIdAndStatusAndCreatedAtAfter(
        merchantId,
        PaymentStatus.SUCCESS,
        thirtyDaysAgo
    );

    BigDecimal volumeLast30Days = paymentRepository.sumAmountByMerchantIdAndStatusAndCreatedAtAfter(
        merchantId,
        PaymentStatus.SUCCESS,
        thirtyDaysAgo
    ).setScale(2, RoundingMode.HALF_UP);

    Optional<CashAdvance> activeAdvance = cashAdvanceRepository.findByMerchantIdAndStatus(
        merchantId,
        AdvanceStatus.ACTIVE
    );

    if (activeAdvance.isPresent()) {
      return new AdvanceEligibilityResponse(
          false,
          BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
          successfulPayments,
          volumeLast30Days,
          "You already have an active advance"
      );
    }

    if (successfulPayments < 5) {
      return new AdvanceEligibilityResponse(
          false,
          BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
          successfulPayments,
          volumeLast30Days,
          "At least 5 successful payments in the last 30 days are required"
      );
    }

    BigDecimal eligibleAmount = volumeLast30Days.multiply(new BigDecimal("0.50")).setScale(2, RoundingMode.HALF_UP);
    return new AdvanceEligibilityResponse(
        true,
        eligibleAmount,
        successfulPayments,
        volumeLast30Days,
        null
    );
  }

  @Transactional
  public CashAdvanceResponse applyForAdvance(Long merchantId, ApplyAdvanceRequest request) {
    AdvanceEligibilityResponse eligibility = checkEligibility(merchantId);
    if (!eligibility.eligible()) {
      throw new BusinessRuleException(eligibility.reason());
    }

    BigDecimal amount = request.amount().setScale(2, RoundingMode.HALF_UP);
    if (amount.compareTo(eligibility.eligibleAmount()) > 0) {
      throw new BusinessRuleException("Requested amount exceeds eligible amount");
    }

    Merchant merchant = merchantRepository.findById(merchantId)
        .orElseThrow(() -> new ResourceNotFoundException("Merchant not found"));

    BigDecimal totalRepayable = amount.multiply(new BigDecimal("1.05")).setScale(2, RoundingMode.HALF_UP);

    CashAdvance advance = new CashAdvance();
    advance.setMerchant(merchant);
    advance.setPrincipal(amount);
    advance.setTotalRepayable(totalRepayable);
    advance.setAmountRepaid(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
    advance.setStatus(AdvanceStatus.ACTIVE);

    CashAdvance saved = cashAdvanceRepository.save(advance);
    walletService.credit(merchantId, amount, LedgerReason.ADVANCE_DISBURSAL, saved.getId());

    return CashAdvanceResponse.from(saved);
  }

  public List<CashAdvanceResponse> getAdvances(Long merchantId) {
    return cashAdvanceRepository.findByMerchantIdOrderByCreatedAtDescIdDesc(merchantId)
        .stream()
        .map(CashAdvanceResponse::from)
        .toList();
  }
}
