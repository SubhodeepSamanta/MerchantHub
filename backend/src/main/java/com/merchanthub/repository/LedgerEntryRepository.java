package com.merchanthub.repository;

import com.merchanthub.entity.LedgerEntry;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, Long> {

  Page<LedgerEntry> findByWalletIdOrderByCreatedAtDescIdDesc(Long walletId, Pageable pageable);

  List<LedgerEntry> findByWalletIdOrderByCreatedAtDescIdDesc(Long walletId);
}
