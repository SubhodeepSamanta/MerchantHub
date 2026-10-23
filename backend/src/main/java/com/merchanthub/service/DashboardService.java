package com.merchanthub.service;

import com.merchanthub.dto.DailyVolumeResponse;
import com.merchanthub.dto.DashboardSummaryResponse;
import com.merchanthub.entity.AdvanceStatus;
import com.merchanthub.entity.CashAdvance;
import com.merchanthub.entity.Payment;
import com.merchanthub.entity.PaymentStatus;
import com.merchanthub.entity.Wallet;
import com.merchanthub.exception.ResourceNotFoundException;
import com.merchanthub.repository.CashAdvanceRepository;
import com.merchanthub.repository.PaymentRepository;
import com.merchanthub.repository.WalletRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

  private final WalletRepository walletRepository;
  private final PaymentRepository paymentRepository;
  private final CashAdvanceRepository cashAdvanceRepository;

  public DashboardService(
      WalletRepository walletRepository,
      PaymentRepository paymentRepository,
      CashAdvanceRepository cashAdvanceRepository
  ) {
    this.walletRepository = walletRepository;
    this.paymentRepository = paymentRepository;
    this.cashAdvanceRepository = cashAdvanceRepository;
  }

  public DashboardSummaryResponse getSummary(Long merchantId) {
    Wallet wallet = walletRepository.findByMerchantId(merchantId)
        .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

    LocalDate today = LocalDate.now();
    LocalDateTime startOfToday = today.atStartOfDay();

    BigDecimal todayVolume = paymentRepository.sumAmountByMerchantIdAndStatusAndCreatedAtAfter(
        merchantId,
        PaymentStatus.SUCCESS,
        startOfToday
    ).setScale(2, RoundingMode.HALF_UP);

    long totalPayments = paymentRepository.countByMerchantId(merchantId);

    long nonPendingCount = paymentRepository.countByMerchantIdAndStatusNot(
        merchantId,
        PaymentStatus.PENDING
    );

    long successfulAndRefunded = paymentRepository.countSuccessfulAndRefundedByMerchantId(merchantId);

    double successRate = 0.0;
    if (nonPendingCount > 0) {
      successRate = BigDecimal.valueOf(((double) successfulAndRefunded / nonPendingCount) * 100.0)
          .setScale(1, RoundingMode.HALF_UP)
          .doubleValue();
    }

    BigDecimal outstandingAdvance = cashAdvanceRepository
        .findByMerchantIdAndStatus(merchantId, AdvanceStatus.ACTIVE)
        .map(CashAdvance::getOutstanding)
        .orElse(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));

    LocalDateTime sixDaysAgoStart = today.minusDays(6).atStartOfDay();
    List<Payment> recentSuccess = paymentRepository.findRecentSuccessfulPayments(
        merchantId,
        PaymentStatus.SUCCESS,
        sixDaysAgoStart
    );

    Map<LocalDate, BigDecimal> dailyMap = new HashMap<>();
    for (Payment p : recentSuccess) {
      LocalDate date = p.getCreatedAt().toLocalDate();
      dailyMap.merge(date, p.getAmount(), BigDecimal::add);
    }

    List<DailyVolumeResponse> dailyVolume = new ArrayList<>(7);
    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    for (int i = 6; i >= 0; i--) {
      LocalDate d = today.minusDays(i);
      BigDecimal sum = dailyMap.getOrDefault(d, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
      dailyVolume.add(new DailyVolumeResponse(d.format(formatter), sum));
    }

    return new DashboardSummaryResponse(
        wallet.getBalance(),
        todayVolume,
        totalPayments,
        successRate,
        outstandingAdvance,
        dailyVolume
    );
  }
}
