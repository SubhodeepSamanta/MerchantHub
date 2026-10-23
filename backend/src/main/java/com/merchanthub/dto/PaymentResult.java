package com.merchanthub.dto;

public record PaymentResult(
    PaymentResponse payment,
    boolean isNew
) {}
