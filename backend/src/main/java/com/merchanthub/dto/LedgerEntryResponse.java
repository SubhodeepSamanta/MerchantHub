package com.merchanthub.dto;

import com.merchanthub.entity.EntryType;
import com.merchanthub.entity.LedgerEntry;
import com.merchanthub.entity.LedgerReason;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record LedgerEntryResponse(
    Long id,
    EntryType entryType,
    LedgerReason reason,
    BigDecimal amount,
    Long referenceId,
    BigDecimal balanceAfter,
    LocalDateTime createdAt
) {

  public static LedgerEntryResponse from(LedgerEntry entry) {
    return new LedgerEntryResponse(
        entry.getId(),
        entry.getEntryType(),
        entry.getReason(),
        entry.getAmount(),
        entry.getReferenceId(),
        entry.getBalanceAfter(),
        entry.getCreatedAt()
    );
  }
}
