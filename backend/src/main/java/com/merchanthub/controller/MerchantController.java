package com.merchanthub.controller;

import com.merchanthub.dto.MerchantResponse;
import com.merchanthub.security.CurrentMerchant;
import com.merchanthub.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/merchants")
public class MerchantController {

  private final AuthService authService;
  private final CurrentMerchant currentMerchant;

  public MerchantController(AuthService authService, CurrentMerchant currentMerchant) {
    this.authService = authService;
    this.currentMerchant = currentMerchant;
  }

  @GetMapping("/me")
  public ResponseEntity<MerchantResponse> getCurrentMerchant() {
    Long merchantId = currentMerchant.getId();
    MerchantResponse response = authService.getCurrentMerchant(merchantId);
    return ResponseEntity.ok(response);
  }
}
