package com.merchanthub.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.merchanthub.entity.EntryType;
import com.merchanthub.entity.LedgerEntry;
import com.merchanthub.entity.LedgerReason;
import com.merchanthub.entity.Wallet;
import com.merchanthub.exception.InsufficientBalanceException;
import com.merchanthub.repository.LedgerEntryRepository;
import com.merchanthub.repository.WalletRepository;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class WalletServiceTest {

  @Mock
  private WalletRepository walletRepository;

  @Mock
  private LedgerEntryRepository ledgerEntryRepository;

  private WalletService walletService;

  @BeforeEach
  void setUp() {
    walletService = new WalletService(walletRepository, ledgerEntryRepository);
  }

  @Test
  void debitWithInsufficientBalanceThrows() {
    Long merchantId = 1L;

    Wallet wallet = new Wallet();
    wallet.setId(10L);
    wallet.setBalance(new BigDecimal("100.00"));

    when(walletRepository.findByMerchantId(merchantId))
        .thenReturn(Optional.of(wallet));

    assertThrows(InsufficientBalanceException.class, () -> {
      walletService.debit(merchantId, new BigDecimal("150.00"), LedgerReason.PAYMENT, 1L);
    });
  }

  @Test
  void creditWritesLedgerEntryWithCorrectBalanceAfter() {
    Long merchantId = 1L;

    Wallet wallet = new Wallet();
    wallet.setId(10L);
    wallet.setBalance(new BigDecimal("500.00"));

    when(walletRepository.findByMerchantId(merchantId))
        .thenReturn(Optional.of(wallet));
    when(walletRepository.save(any(Wallet.class)))
        .thenAnswer(inv -> inv.getArgument(0));

    walletService.credit(merchantId, new BigDecimal("250.00"), LedgerReason.PAYMENT, 101L);

    assertEquals(new BigDecimal("750.00"), wallet.getBalance());

    ArgumentCaptor<LedgerEntry> captor = ArgumentCaptor.forClass(LedgerEntry.class);
    verify(ledgerEntryRepository).save(captor.capture());

    LedgerEntry savedEntry = captor.getValue();
    assertEquals(EntryType.CREDIT, savedEntry.getEntryType());
    assertEquals(LedgerReason.PAYMENT, savedEntry.getReason());
    assertEquals(new BigDecimal("250.00"), savedEntry.getAmount());
    assertEquals(101L, savedEntry.getReferenceId());
    assertEquals(new BigDecimal("750.00"), savedEntry.getBalanceAfter());
  }
}
