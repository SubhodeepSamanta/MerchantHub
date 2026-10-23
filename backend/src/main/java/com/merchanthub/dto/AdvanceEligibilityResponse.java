package com.merchanthub.dto;

import java.math.BigDecimal;

public record AdvanceEligibilityResponse(
    boolean eligible,
    BigDecimal eligibleAmount,
    long successfulPaymentsLast30Days,
    BigDecimal volumeLast30Days,
    String reason
) {}
