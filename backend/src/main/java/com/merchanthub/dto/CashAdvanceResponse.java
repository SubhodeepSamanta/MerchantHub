package com.merchanthub.dto;

import com.merchanthub.entity.AdvanceStatus;
import com.merchanthub.entity.CashAdvance;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CashAdvanceResponse(
    Long id,
    BigDecimal principal,
    BigDecimal totalRepayable,
    BigDecimal amountRepaid,
    BigDecimal outstanding,
    AdvanceStatus status,
    LocalDateTime createdAt
) {

  public static CashAdvanceResponse from(CashAdvance advance) {
    return new CashAdvanceResponse(
        advance.getId(),
        advance.getPrincipal(),
        advance.getTotalRepayable(),
        advance.getAmountRepaid(),
        advance.getOutstanding(),
        advance.getStatus(),
        advance.getCreatedAt()
    );
  }
}
