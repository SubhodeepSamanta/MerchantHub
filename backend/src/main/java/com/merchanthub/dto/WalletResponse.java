package com.merchanthub.dto;

import com.merchanthub.entity.Wallet;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record WalletResponse(
    BigDecimal balance,
    LocalDateTime updatedAt
) {

  public static WalletResponse from(Wallet wallet) {
    return new WalletResponse(
        wallet.getBalance(),
        wallet.getUpdatedAt()
    );
  }
}
