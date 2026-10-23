package com.merchanthub.dto;

import com.merchanthub.entity.Merchant;
import java.time.LocalDateTime;

public record MerchantResponse(
    Long id,
    String businessName,
    String email,
    String phone,
    String slug,
    LocalDateTime createdAt
) {

  public static MerchantResponse from(Merchant merchant) {
    return new MerchantResponse(
        merchant.getId(),
        merchant.getBusinessName(),
        merchant.getEmail(),
        merchant.getPhone(),
        merchant.getSlug(),
        merchant.getCreatedAt()
    );
  }
}
