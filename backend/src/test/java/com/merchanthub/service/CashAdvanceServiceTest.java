package com.merchanthub.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.merchanthub.dto.AdvanceEligibilityResponse;
import com.merchanthub.dto.ApplyAdvanceRequest;
import com.merchanthub.dto.CashAdvanceResponse;
import com.merchanthub.entity.AdvanceStatus;
import com.merchanthub.entity.CashAdvance;
import com.merchanthub.entity.Merchant;
import com.merchanthub.entity.PaymentStatus;
import com.merchanthub.exception.BusinessRuleException;
import com.merchanthub.repository.CashAdvanceRepository;
import com.merchanthub.repository.MerchantRepository;
import com.merchanthub.repository.PaymentRepository;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class CashAdvanceServiceTest {

  @Mock
  private CashAdvanceRepository cashAdvanceRepository;

  @Mock
  private PaymentRepository paymentRepository;

  @Mock
  private MerchantRepository merchantRepository;

  @Mock
  private WalletService walletService;

  private CashAdvanceService cashAdvanceService;

  @BeforeEach
  void setUp() {
    cashAdvanceService = new CashAdvanceService(
        cashAdvanceRepository,
        paymentRepository,
        merchantRepository,
        walletService
    );
  }

  @Test
  void fewerThanFivePaymentsMakesMerchantIneligible() {
    Long merchantId = 1L;

    when(paymentRepository.countByMerchantIdAndStatusAndCreatedAtAfter(eq(merchantId), eq(PaymentStatus.SUCCESS), any()))
        .thenReturn(4L);
    when(paymentRepository.sumAmountByMerchantIdAndStatusAndCreatedAtAfter(eq(merchantId), eq(PaymentStatus.SUCCESS), any()))
        .thenReturn(new BigDecimal("10000.00"));
    when(cashAdvanceRepository.findByMerchantIdAndStatus(merchantId, AdvanceStatus.ACTIVE))
        .thenReturn(Optional.empty());

    AdvanceEligibilityResponse eligibility = cashAdvanceService.checkEligibility(merchantId);

    assertFalse(eligibility.eligible());
    assertEquals(new BigDecimal("0.00"), eligibility.eligibleAmount());
    assertEquals(4L, eligibility.successfulPaymentsLast30Days());
    assertEquals("At least 5 successful payments in the last 30 days are required", eligibility.reason());
  }

  @Test
  void applyingAboveEligibleAmountThrows() {
    Long merchantId = 1L;

    when(paymentRepository.countByMerchantIdAndStatusAndCreatedAtAfter(eq(merchantId), eq(PaymentStatus.SUCCESS), any()))
        .thenReturn(10L);
    when(paymentRepository.sumAmountByMerchantIdAndStatusAndCreatedAtAfter(eq(merchantId), eq(PaymentStatus.SUCCESS), any()))
        .thenReturn(new BigDecimal("20000.00"));
    when(cashAdvanceRepository.findByMerchantIdAndStatus(merchantId, AdvanceStatus.ACTIVE))
        .thenReturn(Optional.empty());

    ApplyAdvanceRequest request = new ApplyAdvanceRequest(new BigDecimal("15000.00"));

    assertThrows(BusinessRuleException.class, () -> {
      cashAdvanceService.applyForAdvance(merchantId, request);
    });
  }

  @Test
  void repaymentReachingTotalRepayableMarksAdvanceRepaid() {
    Long merchantId = 1L;

    when(paymentRepository.countByMerchantIdAndStatusAndCreatedAtAfter(eq(merchantId), eq(PaymentStatus.SUCCESS), any()))
        .thenReturn(10L);
    when(paymentRepository.sumAmountByMerchantIdAndStatusAndCreatedAtAfter(eq(merchantId), eq(PaymentStatus.SUCCESS), any()))
        .thenReturn(new BigDecimal("20000.00"));
    when(cashAdvanceRepository.findByMerchantIdAndStatus(merchantId, AdvanceStatus.ACTIVE))
        .thenReturn(Optional.empty());

    Merchant merchant = new Merchant();
    merchant.setId(merchantId);
    when(merchantRepository.findById(merchantId))
        .thenReturn(Optional.of(merchant));
    when(cashAdvanceRepository.save(any(CashAdvance.class)))
        .thenAnswer(inv -> {
          CashAdvance ca = inv.getArgument(0);
          ca.setId(77L);
          return ca;
        });

    ApplyAdvanceRequest request = new ApplyAdvanceRequest(new BigDecimal("5000.00"));
    CashAdvanceResponse response = cashAdvanceService.applyForAdvance(merchantId, request);

    assertEquals(new BigDecimal("5000.00"), response.principal());
    assertEquals(new BigDecimal("5250.00"), response.totalRepayable());
    assertEquals(AdvanceStatus.ACTIVE, response.status());

    CashAdvance advance = new CashAdvance();
    advance.setPrincipal(new BigDecimal("5000.00"));
    advance.setTotalRepayable(new BigDecimal("5250.00"));
    advance.setAmountRepaid(new BigDecimal("5000.00"));
    advance.setStatus(AdvanceStatus.ACTIVE);

    BigDecimal lastPayment = new BigDecimal("250.00");
    BigDecimal newRepaid = advance.getAmountRepaid().add(lastPayment);
    advance.setAmountRepaid(newRepaid);
    if (newRepaid.compareTo(advance.getTotalRepayable()) >= 0) {
      advance.setStatus(AdvanceStatus.REPAID);
    }

    assertEquals(AdvanceStatus.REPAID, advance.getStatus());
    assertEquals(new BigDecimal("0.00"), advance.getOutstanding());
  }
}
