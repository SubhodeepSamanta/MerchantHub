package com.merchanthub.controller;

import com.merchanthub.dto.LedgerEntryResponse;
import com.merchanthub.dto.PageResponse;
import com.merchanthub.dto.WalletResponse;
import com.merchanthub.security.CurrentMerchant;
import com.merchanthub.service.LedgerService;
import com.merchanthub.service.WalletService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wallet")
public class WalletController {

  private final WalletService walletService;
  private final LedgerService ledgerService;
  private final CurrentMerchant currentMerchant;

  public WalletController(
      WalletService walletService,
      LedgerService ledgerService,
      CurrentMerchant currentMerchant
  ) {
    this.walletService = walletService;
    this.ledgerService = ledgerService;
    this.currentMerchant = currentMerchant;
  }

  @GetMapping
  public ResponseEntity<WalletResponse> getWallet() {
    Long merchantId = currentMerchant.getId();
    WalletResponse response = walletService.getWallet(merchantId);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/ledger")
  public ResponseEntity<PageResponse<LedgerEntryResponse>> getLedger(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size
  ) {
    Long merchantId = currentMerchant.getId();
    PageResponse<LedgerEntryResponse> response = ledgerService.getLedger(merchantId, page, size);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/ledger/export")
  public ResponseEntity<byte[]> exportLedger() {
    Long merchantId = currentMerchant.getId();
    byte[] csvData = ledgerService.exportCsv(merchantId);

    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"merchanthub-ledger.csv\"")
        .contentType(MediaType.parseMediaType("text/csv"))
        .body(csvData);
  }
}
