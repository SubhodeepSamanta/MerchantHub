package com.merchanthub.controller;

import com.merchanthub.dto.DashboardSummaryResponse;
import com.merchanthub.security.CurrentMerchant;
import com.merchanthub.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

  private final DashboardService dashboardService;
  private final CurrentMerchant currentMerchant;

  public DashboardController(DashboardService dashboardService, CurrentMerchant currentMerchant) {
    this.dashboardService = dashboardService;
    this.currentMerchant = currentMerchant;
  }

  @GetMapping("/summary")
  public ResponseEntity<DashboardSummaryResponse> getSummary() {
    Long merchantId = currentMerchant.getId();
    DashboardSummaryResponse response = dashboardService.getSummary(merchantId);
    return ResponseEntity.ok(response);
  }
}
