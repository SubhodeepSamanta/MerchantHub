package com.merchanthub.service;

import com.merchanthub.dto.LedgerEntryResponse;
import com.merchanthub.dto.PageResponse;
import com.merchanthub.entity.LedgerEntry;
import com.merchanthub.entity.Wallet;
import com.merchanthub.exception.ResourceNotFoundException;
import com.merchanthub.repository.LedgerEntryRepository;
import com.merchanthub.repository.WalletRepository;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class LedgerService {

  private final WalletRepository walletRepository;
  private final LedgerEntryRepository ledgerEntryRepository;

  public LedgerService(
      WalletRepository walletRepository,
      LedgerEntryRepository ledgerEntryRepository
  ) {
    this.walletRepository = walletRepository;
    this.ledgerEntryRepository = ledgerEntryRepository;
  }

  public PageResponse<LedgerEntryResponse> getLedger(Long merchantId, int page, int size) {
    Wallet wallet = walletRepository.findByMerchantId(merchantId)
        .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

    int effectiveSize = Math.min(Math.max(size, 1), 100);
    Pageable pageable = PageRequest.of(Math.max(page, 0), effectiveSize);

    Page<LedgerEntry> entryPage = ledgerEntryRepository
        .findByWalletIdOrderByCreatedAtDescIdDesc(wallet.getId(), pageable);

    return PageResponse.from(entryPage, LedgerEntryResponse::from);
  }

  public byte[] exportCsv(Long merchantId) {
    Wallet wallet = walletRepository.findByMerchantId(merchantId)
        .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

    List<LedgerEntry> entries = ledgerEntryRepository
        .findByWalletIdOrderByCreatedAtDescIdDesc(wallet.getId());

    StringBuilder sb = new StringBuilder();
    sb.append("Date,Type,Reason,Reference,Amount,Balance After\n");

    for (LedgerEntry entry : entries) {
      sb.append(entry.getCreatedAt()).append(",")
          .append(entry.getEntryType()).append(",")
          .append(entry.getReason()).append(",")
          .append(entry.getReferenceId()).append(",")
          .append(entry.getAmount()).append(",")
          .append(entry.getBalanceAfter()).append("\n");
    }

    return sb.toString().getBytes(StandardCharsets.UTF_8);
  }
}
