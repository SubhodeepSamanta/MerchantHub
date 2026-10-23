package com.merchanthub.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentMerchant {

  public Long getId() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || authentication.getPrincipal() == null) {
      return null;
    }
    Object principal = authentication.getPrincipal();
    if (principal instanceof Long id) {
      return id;
    }
    if (principal instanceof String str) {
      try {
        return Long.valueOf(str);
      } catch (NumberFormatException e) {
        return null;
      }
    }
    return null;
  }
}
