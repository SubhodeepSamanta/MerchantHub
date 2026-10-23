package com.merchanthub.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardSummaryResponse(
    BigDecimal walletBalance,
    BigDecimal todayVolume,
    long totalPayments,
    double successRate,
    BigDecimal outstandingAdvance,
    List<DailyVolumeResponse> dailyVolume
) {}
