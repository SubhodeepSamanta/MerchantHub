package com.merchanthub.controller;

import com.merchanthub.dto.CreatePaymentRequest;
import com.merchanthub.dto.PaymentResult;
import com.merchanthub.dto.PublicMerchantResponse;
import com.merchanthub.dto.PublicPaymentRequest;
import com.merchanthub.dto.PublicPaymentResponse;
import com.merchanthub.entity.Merchant;
import com.merchanthub.exception.ResourceNotFoundException;
import com.merchanthub.repository.MerchantRepository;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/merchants")
public class PublicCheckoutController {

  private final MerchantRepository merchantRepository;
  private final PaymentService paymentService;

  public PublicCheckoutController(
      MerchantRepository merchantRepository,
      PaymentService paymentService
  ) {
    this.merchantRepository = merchantRepository;
    this.paymentService = paymentService;
  }

  @GetMapping("/{slug}")
  public ResponseEntity<PublicMerchantResponse> getPublicMerchant(@PathVariable String slug) {
    Merchant merchant = merchantRepository.findBySlug(slug)
        .orElseThrow(() -> new ResourceNotFoundException("This payment link is not valid"));

    return ResponseEntity.ok(new PublicMerchantResponse(merchant.getBusinessName(), merchant.getSlug()));
  }

  @PostMapping("/{slug}/pay")
  public ResponseEntity<PublicPaymentResponse> pay(
      @PathVariable String slug,
      @RequestHeader("Idempotency-Key") String idempotencyKey,
      @Valid @RequestBody PublicPaymentRequest request
  ) {
    Merchant merchant = merchantRepository.findBySlug(slug)
        .orElseThrow(() -> new ResourceNotFoundException("This payment link is not valid"));

    CreatePaymentRequest createPaymentRequest = new CreatePaymentRequest(
        request.payerVpa(),
        request.amount(),
        "Paid via payment link"
    );

    PaymentResult result = paymentService.processPayment(
        merchant.getId(),
        idempotencyKey,
        createPaymentRequest
    );

    PublicPaymentResponse response = new PublicPaymentResponse(
        result.payment().id(),
        result.payment().status(),
        result.payment().amount(),
        result.payment().createdAt()
    );

    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }
}
