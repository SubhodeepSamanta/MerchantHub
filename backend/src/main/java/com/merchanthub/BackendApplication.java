package com.merchanthub;

import java.util.TimeZone;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendApplication {

  static {
    TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
  }

  public static void main(String[] args) {
    TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
    SpringApplication.run(BackendApplication.class, args);
  }
}
