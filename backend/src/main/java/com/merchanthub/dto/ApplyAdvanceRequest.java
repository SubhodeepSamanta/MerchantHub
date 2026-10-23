package com.merchanthub.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record ApplyAdvanceRequest(
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1000.00", message = "Amount must be at least 1000.00")
    BigDecimal amount
) {}
