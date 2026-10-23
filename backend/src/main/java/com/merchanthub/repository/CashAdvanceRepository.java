package com.merchanthub.repository;

import com.merchanthub.entity.AdvanceStatus;
import com.merchanthub.entity.CashAdvance;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CashAdvanceRepository extends JpaRepository<CashAdvance, Long> {

  Optional<CashAdvance> findByMerchantIdAndStatus(Long merchantId, AdvanceStatus status);

  List<CashAdvance> findByMerchantIdOrderByCreatedAtDescIdDesc(Long merchantId);
}
