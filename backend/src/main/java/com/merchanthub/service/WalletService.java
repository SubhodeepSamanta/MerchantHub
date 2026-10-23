package com.merchanthub.service;

import com.merchanthub.dto.WalletResponse;
import com.merchanthub.entity.EntryType;
import com.merchanthub.entity.LedgerEntry;
import com.merchanthub.entity.LedgerReason;
import com.merchanthub.entity.Wallet;
import com.merchanthub.exception.InsufficientBalanceException;
import com.merchanthub.exception.ResourceNotFoundException;
import com.merchanthub.repository.LedgerEntryRepository;
import com.merchanthub.repository.WalletRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WalletService {

  private final WalletRepository walletRepository;
  private final LedgerEntryRepository ledgerEntryRepository;

  public WalletService(
      WalletRepository walletRepository,
      LedgerEntryRepository ledgerEntryRepository
  ) {
    this.walletRepository = walletRepository;
    this.ledgerEntryRepository = ledgerEntryRepository;
  }

  public WalletResponse getWallet(Long merchantId) {
    Wallet wallet = walletRepository.findByMerchantId(merchantId)
        .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));
    return WalletResponse.from(wallet);
  }

  @Transactional
  public Wallet credit(Long merchantId, BigDecimal amount, LedgerReason reason, Long referenceId) {
    return credit(merchantId, amount, reason, referenceId, LocalDateTime.now());
  }

  @Transactional
  public Wallet credit(
      Long merchantId,
      BigDecimal amount,
      LedgerReason reason,
      Long referenceId,
      LocalDateTime timestamp
  ) {
    Wallet wallet = walletRepository.findByMerchantId(merchantId)
        .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

    BigDecimal scaledAmount = amount.setScale(2, RoundingMode.HALF_UP);
    BigDecimal newBalance = wallet.getBalance().add(scaledAmount).setScale(2, RoundingMode.HALF_UP);

    wallet.setBalance(newBalance);
    wallet.setUpdatedAt(timestamp);
    Wallet savedWallet = walletRepository.save(wallet);

    LedgerEntry entry = new LedgerEntry();
    entry.setWallet(savedWallet);
    entry.setEntryType(EntryType.CREDIT);
    entry.setReason(reason);
    entry.setAmount(scaledAmount);
    entry.setReferenceId(referenceId);
    entry.setBalanceAfter(newBalance);
    entry.setCreatedAt(timestamp);
    ledgerEntryRepository.save(entry);

    return savedWallet;
  }

  @Transactional
  public Wallet debit(Long merchantId, BigDecimal amount, LedgerReason reason, Long referenceId) {
    return debit(merchantId, amount, reason, referenceId, LocalDateTime.now());
  }

  @Transactional
  public Wallet debit(
      Long merchantId,
      BigDecimal amount,
      LedgerReason reason,
      Long referenceId,
      LocalDateTime timestamp
  ) {
    Wallet wallet = walletRepository.findByMerchantId(merchantId)
        .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

    BigDecimal scaledAmount = amount.setScale(2, RoundingMode.HALF_UP);
    if (wallet.getBalance().compareTo(scaledAmount) < 0) {
      if (reason == LedgerReason.REFUND) {
        throw new InsufficientBalanceException("Insufficient wallet balance for this refund");
      }
      throw new InsufficientBalanceException("Insufficient wallet balance");
    }

    BigDecimal newBalance = wallet.getBalance().subtract(scaledAmount).setScale(2, RoundingMode.HALF_UP);

    wallet.setBalance(newBalance);
    wallet.setUpdatedAt(timestamp);
    Wallet savedWallet = walletRepository.save(wallet);

    LedgerEntry entry = new LedgerEntry();
    entry.setWallet(savedWallet);
    entry.setEntryType(EntryType.DEBIT);
    entry.setReason(reason);
    entry.setAmount(scaledAmount);
    entry.setReferenceId(referenceId);
    entry.setBalanceAfter(newBalance);
    entry.setCreatedAt(timestamp);
    ledgerEntryRepository.save(entry);

    return savedWallet;
  }
}
