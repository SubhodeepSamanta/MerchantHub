package com.merchanthub.dto;

import com.merchanthub.entity.Payment;
import com.merchanthub.entity.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(
    Long id,
    String payerVpa,
    BigDecimal amount,
    String note,
    PaymentStatus status,
    String idempotencyKey,
    LocalDateTime createdAt
) {

  public static PaymentResponse from(Payment payment) {
    return new PaymentResponse(
        payment.getId(),
        payment.getPayerVpa(),
        payment.getAmount(),
        payment.getNote(),
        payment.getStatus(),
        payment.getIdempotencyKey(),
        payment.getCreatedAt()
    );
  }
}
