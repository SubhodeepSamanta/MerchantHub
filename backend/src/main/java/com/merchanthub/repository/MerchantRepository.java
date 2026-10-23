package com.merchanthub.repository;

import com.merchanthub.entity.Merchant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MerchantRepository extends JpaRepository<Merchant, Long> {

  Optional<Merchant> findByEmail(String email);

  Optional<Merchant> findBySlug(String slug);

  boolean existsByEmail(String email);

  boolean existsBySlug(String slug);
}
