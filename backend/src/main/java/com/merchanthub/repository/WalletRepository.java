package com.merchanthub.repository;

import com.merchanthub.entity.Wallet;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WalletRepository extends JpaRepository<Wallet, Long> {

  Optional<Wallet> findByMerchantId(Long merchantId);
}
