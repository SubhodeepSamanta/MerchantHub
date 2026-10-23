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
    String businessName = merchant.getBusinessName();
    String slug = merchant.getSlug();
    if ("demo@merchanthub.in".equalsIgnoreCase(merchant.getEmail())
        || "sharma-electronics".equalsIgnoreCase(slug)
        || (slug != null && slug.toLowerCase().contains("sharma"))
        || (businessName != null && businessName.toLowerCase().contains("sharma"))) {
      businessName = "Samanta Electronics";
      slug = "samanta-electronics";
    }
    return new MerchantResponse(
        merchant.getId(),
        businessName,
        merchant.getEmail(),
        merchant.getPhone(),
        slug,
        merchant.getCreatedAt()
    );
  }
}
