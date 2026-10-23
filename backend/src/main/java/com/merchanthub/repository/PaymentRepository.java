package com.merchanthub.repository;

import com.merchanthub.entity.Payment;
import com.merchanthub.entity.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

  Optional<Payment> findByMerchantIdAndIdempotencyKey(Long merchantId, String idempotencyKey);

  Optional<Payment> findByIdAndMerchantId(Long id, Long merchantId);

  Page<Payment> findByMerchantIdOrderByCreatedAtDescIdDesc(Long merchantId, Pageable pageable);

  Page<Payment> findByMerchantIdAndStatusOrderByCreatedAtDescIdDesc(
      Long merchantId,
      PaymentStatus status,
      Pageable pageable
  );

  @Query("SELECT COUNT(p) FROM Payment p WHERE p.merchant.id = :merchantId AND p.status = :status AND p.createdAt >= :since")
  long countByMerchantIdAndStatusAndCreatedAtAfter(
      @Param("merchantId") Long merchantId,
      @Param("status") PaymentStatus status,
      @Param("since") LocalDateTime since
  );

  @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.merchant.id = :merchantId AND p.status = :status AND p.createdAt >= :since")
  BigDecimal sumAmountByMerchantIdAndStatusAndCreatedAtAfter(
      @Param("merchantId") Long merchantId,
      @Param("status") PaymentStatus status,
      @Param("since") LocalDateTime since
  );

  long countByMerchantId(Long merchantId);

  @Query("SELECT COUNT(p) FROM Payment p WHERE p.merchant.id = :merchantId AND p.status != :excludedStatus")
  long countByMerchantIdAndStatusNot(
      @Param("merchantId") Long merchantId,
      @Param("excludedStatus") PaymentStatus excludedStatus
  );

  @Query("SELECT COUNT(p) FROM Payment p WHERE p.merchant.id = :merchantId AND (p.status = 'SUCCESS' OR p.status = 'REFUNDED')")
  long countSuccessfulAndRefundedByMerchantId(@Param("merchantId") Long merchantId);

  @Query("SELECT p FROM Payment p WHERE p.merchant.id = :merchantId AND p.status = :status AND p.createdAt >= :since ORDER BY p.createdAt ASC")
  List<Payment> findRecentSuccessfulPayments(
      @Param("merchantId") Long merchantId,
      @Param("status") PaymentStatus status,
      @Param("since") LocalDateTime since
  );
}
