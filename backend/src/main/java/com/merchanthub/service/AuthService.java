package com.merchanthub.service;

import com.merchanthub.dto.AuthResponse;
import com.merchanthub.dto.LoginRequest;
import com.merchanthub.dto.MerchantResponse;
import com.merchanthub.dto.RegisterRequest;
import com.merchanthub.entity.Merchant;
import com.merchanthub.entity.Wallet;
import com.merchanthub.exception.DuplicateEmailException;
import com.merchanthub.exception.ResourceNotFoundException;
import com.merchanthub.repository.MerchantRepository;
import com.merchanthub.repository.WalletRepository;
import com.merchanthub.security.JwtService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

  private final MerchantRepository merchantRepository;
  private final WalletRepository walletRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  public AuthService(
      MerchantRepository merchantRepository,
      WalletRepository walletRepository,
      PasswordEncoder passwordEncoder,
      JwtService jwtService
  ) {
    this.merchantRepository = merchantRepository;
    this.walletRepository = walletRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
  }

  @Transactional
  public AuthResponse register(RegisterRequest request) {
    if (merchantRepository.existsByEmail(request.email())) {
      throw new DuplicateEmailException("An account with this email already exists");
    }

    String baseSlug = generateBaseSlug(request.businessName());
    String slug = baseSlug;
    int counter = 2;
    while (merchantRepository.existsBySlug(slug)) {
      slug = baseSlug + "-" + counter;
      counter++;
    }

    Merchant merchant = new Merchant();
    merchant.setBusinessName(request.businessName().trim());
    merchant.setEmail(request.email().trim().toLowerCase());
    merchant.setPassword(passwordEncoder.encode(request.password()));
    merchant.setPhone(request.phone().trim());
    merchant.setSlug(slug);

    Merchant savedMerchant = merchantRepository.save(merchant);

    Wallet wallet = new Wallet();
    wallet.setMerchant(savedMerchant);
    wallet.setBalance(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
    walletRepository.save(wallet);

    String token = jwtService.generateToken(savedMerchant);
    return new AuthResponse(token, MerchantResponse.from(savedMerchant));
  }

  public AuthResponse login(LoginRequest request) {
    Merchant merchant = merchantRepository.findByEmail(request.email().trim().toLowerCase())
        .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

    if (!passwordEncoder.matches(request.password(), merchant.getPassword())) {
      throw new BadCredentialsException("Invalid email or password");
    }

    String token = jwtService.generateToken(merchant);
    return new AuthResponse(token, MerchantResponse.from(merchant));
  }

  public MerchantResponse getCurrentMerchant(Long merchantId) {
    Merchant merchant = merchantRepository.findById(merchantId)
        .orElseThrow(() -> new ResourceNotFoundException("Merchant not found"));
    return MerchantResponse.from(merchant);
  }

  private String generateBaseSlug(String businessName) {
    String clean = businessName.trim().toLowerCase()
        .replaceAll("[^a-z0-9]+", "-")
        .replaceAll("^-+|-+$", "");
    return clean.isEmpty() ? "merchant" : clean;
  }
}
