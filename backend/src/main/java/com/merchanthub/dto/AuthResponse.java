package com.merchanthub.dto;

public record AuthResponse(
    String token,
    MerchantResponse merchant
) {}
