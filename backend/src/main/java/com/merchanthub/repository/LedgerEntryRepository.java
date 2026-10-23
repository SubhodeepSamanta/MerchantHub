package com.merchanthub.repository;

import com.merchanthub.entity.LedgerEntry;
import com.merchanthub.entity.LedgerReason;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, Long> {

  Page<LedgerEntry> findByWalletIdOrderByCreatedAtDescIdDesc(Long walletId, Pageable pageable);

  List<LedgerEntry> findByWalletIdOrderByCreatedAtDescIdDesc(Long walletId);

  Optional<LedgerEntry> findFirstByReferenceIdAndReason(Long referenceId, LedgerReason reason);
}
