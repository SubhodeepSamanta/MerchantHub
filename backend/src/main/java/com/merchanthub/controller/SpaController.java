package com.merchanthub.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    @GetMapping({
        "/dashboard",
        "/payments",
        "/ledger",
        "/advances",
        "/payment-link",
        "/login",
        "/register",
        "/pay/**"
    })
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}
