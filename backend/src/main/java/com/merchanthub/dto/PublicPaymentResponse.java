package com.merchanthub.dto;

import com.merchanthub.entity.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PublicPaymentResponse(
    Long id,
    PaymentStatus status,
    BigDecimal amount,
    LocalDateTime createdAt
) {}
