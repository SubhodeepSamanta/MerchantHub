package com.merchanthub.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "cash_advances")
@Getter
@Setter
@NoArgsConstructor
public class CashAdvance {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "merchant_id", nullable = false)
  private Merchant merchant;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal principal;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal totalRepayable;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal amountRepaid;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private AdvanceStatus status;

  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @PrePersist
  public void prePersist() {
    if (createdAt == null) {
      createdAt = LocalDateTime.now();
    }
  }

  public BigDecimal getOutstanding() {
    BigDecimal repaid = amountRepaid != null ? amountRepaid : BigDecimal.ZERO;
    return totalRepayable.subtract(repaid).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
  }
}
