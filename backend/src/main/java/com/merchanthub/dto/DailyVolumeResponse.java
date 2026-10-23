package com.merchanthub.dto;

import java.math.BigDecimal;

public record DailyVolumeResponse(
    String date,
    BigDecimal amount
) {}
