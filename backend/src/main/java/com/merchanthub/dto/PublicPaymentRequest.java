package com.merchanthub.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record PublicPaymentRequest(
    @NotBlank(message = "Payer VPA is required")
    @Pattern(regexp = ".*@.*", message = "Payer VPA must contain @")
    @Size(max = 60, message = "Payer VPA must not exceed 60 characters")
    String payerVpa,

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.00", message = "Amount must be at least 1.00")
    @DecimalMax(value = "100000.00", message = "Amount must not exceed 100000.00")
    BigDecimal amount
) {}
