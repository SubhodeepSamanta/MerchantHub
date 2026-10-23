package com.merchanthub.controller;

import com.merchanthub.dto.CreatePaymentRequest;
import com.merchanthub.dto.PageResponse;
import com.merchanthub.dto.PaymentResponse;
import com.merchanthub.dto.PaymentResult;
import com.merchanthub.entity.PaymentStatus;
import com.merchanthub.security.CurrentMerchant;
import com.merchanthub.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

  private final PaymentService paymentService;
  private final CurrentMerchant currentMerchant;

  public PaymentController(PaymentService paymentService, CurrentMerchant currentMerchant) {
    this.paymentService = paymentService;
    this.currentMerchant = currentMerchant;
  }

  @PostMapping
  public ResponseEntity<PaymentResponse> createPayment(
      @RequestHeader("Idempotency-Key") String idempotencyKey,
      @Valid @RequestBody CreatePaymentRequest request
  ) {
    Long merchantId = currentMerchant.getId();
    PaymentResult result = paymentService.processPayment(merchantId, idempotencyKey, request);

    if (result.isNew()) {
      return ResponseEntity.status(HttpStatus.CREATED).body(result.payment());
    }
    return ResponseEntity.ok(result.payment());
  }

  @GetMapping
  public ResponseEntity<PageResponse<PaymentResponse>> getPayments(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(required = false) PaymentStatus status
  ) {
    Long merchantId = currentMerchant.getId();
    PageResponse<PaymentResponse> response = paymentService.getPayments(merchantId, page, size, status);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/{id}")
  public ResponseEntity<PaymentResponse> getPayment(@PathVariable Long id) {
    Long merchantId = currentMerchant.getId();
    PaymentResponse response = paymentService.getPayment(merchantId, id);
    return ResponseEntity.ok(response);
  }

  @PostMapping("/{id}/refund")
  public ResponseEntity<PaymentResponse> refundPayment(@PathVariable Long id) {
    Long merchantId = currentMerchant.getId();
    PaymentResponse response = paymentService.refundPayment(merchantId, id);
    return ResponseEntity.ok(response);
  }
}
