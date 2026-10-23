package com.merchanthub.controller;

import com.merchanthub.dto.AdvanceEligibilityResponse;
import com.merchanthub.dto.ApplyAdvanceRequest;
import com.merchanthub.dto.CashAdvanceResponse;
import com.merchanthub.security.CurrentMerchant;
import com.merchanthub.service.CashAdvanceService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/advances")
public class CashAdvanceController {

  private final CashAdvanceService cashAdvanceService;
  private final CurrentMerchant currentMerchant;

  public CashAdvanceController(
      CashAdvanceService cashAdvanceService,
      CurrentMerchant currentMerchant
  ) {
    this.cashAdvanceService = cashAdvanceService;
    this.currentMerchant = currentMerchant;
  }

  @GetMapping("/eligibility")
  public ResponseEntity<AdvanceEligibilityResponse> getEligibility() {
    Long merchantId = currentMerchant.getId();
    AdvanceEligibilityResponse response = cashAdvanceService.checkEligibility(merchantId);
    return ResponseEntity.ok(response);
  }

  @PostMapping
  public ResponseEntity<CashAdvanceResponse> applyForAdvance(
      @Valid @RequestBody ApplyAdvanceRequest request
  ) {
    Long merchantId = currentMerchant.getId();
    CashAdvanceResponse response = cashAdvanceService.applyForAdvance(merchantId, request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping
  public ResponseEntity<List<CashAdvanceResponse>> getAdvances() {
    Long merchantId = currentMerchant.getId();
    List<CashAdvanceResponse> response = cashAdvanceService.getAdvances(merchantId);
    return ResponseEntity.ok(response);
  }
}
