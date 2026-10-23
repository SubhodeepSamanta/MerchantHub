package com.merchanthub.config;

import com.merchanthub.entity.LedgerReason;
import com.merchanthub.entity.Merchant;
import com.merchanthub.entity.Payment;
import com.merchanthub.entity.PaymentStatus;
import com.merchanthub.entity.Wallet;
import com.merchanthub.repository.MerchantRepository;
import com.merchanthub.repository.PaymentRepository;
import com.merchanthub.repository.WalletRepository;
import com.merchanthub.service.WalletService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("demo")
public class DemoDataSeeder implements CommandLineRunner {

  private final MerchantRepository merchantRepository;
  private final WalletRepository walletRepository;
  private final PaymentRepository paymentRepository;
  private final WalletService walletService;
  private final PasswordEncoder passwordEncoder;

  public DemoDataSeeder(
      MerchantRepository merchantRepository,
      WalletRepository walletRepository,
      PaymentRepository paymentRepository,
      WalletService walletService,
      PasswordEncoder passwordEncoder
  ) {
    this.merchantRepository = merchantRepository;
    this.walletRepository = walletRepository;
    this.paymentRepository = paymentRepository;
    this.walletService = walletService;
    this.passwordEncoder = passwordEncoder;
  }

  @Override
  @Transactional
  public void run(String... args) {
    merchantRepository.findBySlug("sharma-electronics").ifPresent(m -> {
      m.setBusinessName("Samanta Electronics");
      m.setSlug("samanta-electronics");
      merchantRepository.save(m);
    });

    Optional<Merchant> existingOpt = merchantRepository.findByEmail("demo@merchanthub.in");
    if (existingOpt.isPresent()) {
      Merchant existing = existingOpt.get();
      if (!"Samanta Electronics".equals(existing.getBusinessName()) || !"samanta-electronics".equals(existing.getSlug())) {
        existing.setBusinessName("Samanta Electronics");
        existing.setSlug("samanta-electronics");
        merchantRepository.save(existing);
      }
      return;
    }

    Merchant merchant = new Merchant();
    merchant.setBusinessName("Samanta Electronics");
    merchant.setEmail("demo@merchanthub.in");
    merchant.setPassword(passwordEncoder.encode("Demo@123"));
    merchant.setPhone("9876543210");
    merchant.setSlug("samanta-electronics");
    merchant.setCreatedAt(LocalDateTime.now().minusDays(30));
    Merchant savedMerchant = merchantRepository.save(merchant);

    Wallet wallet = new Wallet();
    wallet.setMerchant(savedMerchant);
    wallet.setBalance(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
    wallet.setCreatedAt(savedMerchant.getCreatedAt());
    wallet.setUpdatedAt(savedMerchant.getCreatedAt());
    walletRepository.save(wallet);

    String[] vpas = {
        "rahul.verma@okaxis",
        "priya.s@ybl",
        "amit88@paytm",
        "rohit.k@icici",
        "neha.gupta@okhdfcbank",
        "deepak.m@paytm",
        "vikram.singh@okaxis",
        "ananya.r@ybl",
        "sunil.kumar@paytm",
        "pooja.samanta@okaxis"
    };

    String[] notes = {
        "Phone case",
        "Charger",
        "Repair service",
        "Screen replacement",
        "USB-C cable",
        "Earphones",
        "Power bank",
        "Bluetooth speaker",
        "Tempered glass",
        "Adapter"
    };

    int[] amounts = {
        250, 450, 1200, 3500, 180, 890, 1500, 2200, 350, 4200,
        600, 150, 2800, 450, 999, 1350, 2100, 750, 3200, 1800,
        450, 290, 850, 1650, 3800, 520, 1250, 2400, 680, 4100,
        340, 1950, 880, 2750, 1100, 490, 3100, 720, 1450, 2300
    };

    LocalDateTime start = LocalDateTime.now().minusDays(29);

    for (int i = 0; i < amounts.length; i++) {
      LocalDateTime time = start.plusHours(i * 17).plusMinutes(i * 7);
      if (time.isAfter(LocalDateTime.now())) {
        time = LocalDateTime.now().minusMinutes((amounts.length - i) * 15);
      }

      Payment p = new Payment();
      p.setMerchant(savedMerchant);
      p.setPayerVpa(vpas[i % vpas.length]);
      p.setAmount(BigDecimal.valueOf(amounts[i]).setScale(2, RoundingMode.HALF_UP));
      p.setNote(notes[i % notes.length]);
      p.setStatus(PaymentStatus.SUCCESS);
      p.setIdempotencyKey(UUID.randomUUID().toString());
      p.setCreatedAt(time);
      Payment savedPayment = paymentRepository.save(p);

      walletService.credit(savedMerchant.getId(), savedPayment.getAmount(), LedgerReason.PAYMENT, savedPayment.getId(), time);
    }

    String[] failVpas = {
        "user.fail@okaxis",
        "test.fail@paytm",
        "customer.fail@ybl",
        "card.fail@icici"
    };

    for (int i = 0; i < failVpas.length; i++) {
      LocalDateTime time = start.plusDays(i * 7 + 2).plusHours(14);
      Payment p = new Payment();
      p.setMerchant(savedMerchant);
      p.setPayerVpa(failVpas[i]);
      p.setAmount(BigDecimal.valueOf(1200 + i * 350).setScale(2, RoundingMode.HALF_UP));
      p.setNote("Declined transaction");
      p.setStatus(PaymentStatus.FAILED);
      p.setIdempotencyKey(UUID.randomUUID().toString());
      p.setCreatedAt(time);
      paymentRepository.save(p);
    }

    LocalDateTime refundSuccessTime = start.plusDays(15).plusHours(10);
    Payment refundPayment = new Payment();
    refundPayment.setMerchant(savedMerchant);
    refundPayment.setPayerVpa("manish.k@okaxis");
    refundPayment.setAmount(BigDecimal.valueOf(850).setScale(2, RoundingMode.HALF_UP));
    refundPayment.setNote("Faulty charger");
    refundPayment.setStatus(PaymentStatus.SUCCESS);
    refundPayment.setIdempotencyKey(UUID.randomUUID().toString());
    refundPayment.setCreatedAt(refundSuccessTime);
    Payment savedRefundPayment = paymentRepository.save(refundPayment);

    walletService.credit(
        savedMerchant.getId(),
        savedRefundPayment.getAmount(),
        LedgerReason.PAYMENT,
        savedRefundPayment.getId(),
        refundSuccessTime
    );

    LocalDateTime refundTime = refundSuccessTime.plusDays(1);
    walletService.debit(
        savedMerchant.getId(),
        savedRefundPayment.getAmount(),
        LedgerReason.REFUND,
        savedRefundPayment.getId(),
        refundTime
    );

    savedRefundPayment.setStatus(PaymentStatus.REFUNDED);
    paymentRepository.save(savedRefundPayment);
  }
}
