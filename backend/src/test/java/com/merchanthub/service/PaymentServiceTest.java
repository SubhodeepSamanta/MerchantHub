package com.merchanthub.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.merchanthub.dto.CreatePaymentRequest;
import com.merchanthub.dto.PaymentResponse;
import com.merchanthub.dto.PaymentResult;
import com.merchanthub.entity.AdvanceStatus;
import com.merchanthub.entity.CashAdvance;
import com.merchanthub.entity.LedgerReason;
import com.merchanthub.entity.Merchant;
import com.merchanthub.entity.Payment;
import com.merchanthub.entity.PaymentStatus;
import com.merchanthub.exception.BusinessRuleException;
import com.merchanthub.repository.CashAdvanceRepository;
import com.merchanthub.repository.MerchantRepository;
import com.merchanthub.repository.PaymentRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class PaymentServiceTest {

  @Mock
  private PaymentRepository paymentRepository;

  @Mock
  private MerchantRepository merchantRepository;

  @Mock
  private WalletService walletService;

  @Mock
  private CashAdvanceRepository cashAdvanceRepository;

  private PaymentService paymentService;

  @BeforeEach
  void setUp() {
    paymentService = new PaymentService(
        paymentRepository,
        merchantRepository,
        walletService,
        cashAdvanceRepository
    );
  }

  @Test
  void existingIdempotencyKeyReturnsExistingPayment() {
    Long merchantId = 1L;
    String idempotencyKey = "key-123";

    Payment existing = new Payment();
    existing.setId(42L);
    existing.setPayerVpa("rahul@okaxis");
    existing.setAmount(new BigDecimal("500.00"));
    existing.setStatus(PaymentStatus.SUCCESS);
    existing.setIdempotencyKey(idempotencyKey);
    existing.setCreatedAt(LocalDateTime.now());

    when(paymentRepository.findByMerchantIdAndIdempotencyKey(merchantId, idempotencyKey))
        .thenReturn(Optional.of(existing));

    CreatePaymentRequest request = new CreatePaymentRequest("rahul@okaxis", new BigDecimal("500.00"), "test");
    PaymentResult result = paymentService.processPayment(merchantId, idempotencyKey, request);

    assertFalse(result.isNew());
    assertEquals(42L, result.payment().id());
    verify(walletService, never()).credit(any(), any(), any(), any());
  }

  @Test
  void failingVpaCreatesFailedPaymentWithoutCredit() {
    Long merchantId = 1L;
    String idempotencyKey = "fail-key";

    Merchant merchant = new Merchant();
    merchant.setId(merchantId);

    when(paymentRepository.findByMerchantIdAndIdempotencyKey(merchantId, idempotencyKey))
        .thenReturn(Optional.empty());
    when(merchantRepository.findById(merchantId))
        .thenReturn(Optional.of(merchant));
    when(paymentRepository.saveAndFlush(any(Payment.class)))
        .thenAnswer(inv -> {
          Payment p = inv.getArgument(0);
          p.setId(99L);
          return p;
        });

    CreatePaymentRequest request = new CreatePaymentRequest("customer.fail@okhdfcbank", new BigDecimal("700.00"), "fail test");
    PaymentResult result = paymentService.processPayment(merchantId, idempotencyKey, request);

    assertTrue(result.isNew());
    assertEquals(PaymentStatus.FAILED, result.payment().status());
    verify(walletService, never()).credit(any(), any(), any(), any(), any());
  }

  @Test
  void refundNonSuccessPaymentThrows() {
    Long merchantId = 1L;
    Long paymentId = 10L;

    Payment failedPayment = new Payment();
    failedPayment.setId(paymentId);
    failedPayment.setStatus(PaymentStatus.FAILED);
    failedPayment.setAmount(new BigDecimal("200.00"));

    when(paymentRepository.findByIdAndMerchantId(paymentId, merchantId))
        .thenReturn(Optional.of(failedPayment));

    assertThrows(BusinessRuleException.class, () -> {
      paymentService.refundPayment(merchantId, paymentId);
    });

    verify(walletService, never()).debit(any(), any(), any(), any());
  }

  @Test
  void successfulPaymentWithActiveAdvanceDeductsRepayment() {
    Long merchantId = 1L;
    String idempotencyKey = "success-advance-key";

    Merchant merchant = new Merchant();
    merchant.setId(merchantId);

    when(paymentRepository.findByMerchantIdAndIdempotencyKey(merchantId, idempotencyKey))
        .thenReturn(Optional.empty());
    when(merchantRepository.findById(merchantId))
        .thenReturn(Optional.of(merchant));
    when(paymentRepository.saveAndFlush(any(Payment.class)))
        .thenAnswer(inv -> {
          Payment p = inv.getArgument(0);
          p.setId(100L);
          return p;
        });

    CashAdvance activeAdvance = new CashAdvance();
    activeAdvance.setId(5L);
    activeAdvance.setPrincipal(new BigDecimal("10000.00"));
    activeAdvance.setTotalRepayable(new BigDecimal("10500.00"));
    activeAdvance.setAmountRepaid(new BigDecimal("2000.00"));
    activeAdvance.setStatus(AdvanceStatus.ACTIVE);

    when(cashAdvanceRepository.findByMerchantIdAndStatus(merchantId, AdvanceStatus.ACTIVE))
        .thenReturn(Optional.of(activeAdvance));

    CreatePaymentRequest request = new CreatePaymentRequest("rahul@okaxis", new BigDecimal("1000.00"), "order");
    PaymentResult result = paymentService.processPayment(merchantId, idempotencyKey, request);

    assertTrue(result.isNew());
    assertEquals(PaymentStatus.SUCCESS, result.payment().status());

    verify(walletService).credit(eq(merchantId), eq(new BigDecimal("1000.00")), eq(LedgerReason.PAYMENT), eq(100L), any());
    verify(walletService).debit(eq(merchantId), eq(new BigDecimal("100.00")), eq(LedgerReason.ADVANCE_REPAYMENT), eq(100L), any());
    assertEquals(new BigDecimal("2100.00"), activeAdvance.getAmountRepaid());
    assertEquals(AdvanceStatus.ACTIVE, activeAdvance.getStatus());
    verify(cashAdvanceRepository).save(activeAdvance);
  }
}
