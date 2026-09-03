package com.medifind.video.config;

import com.medifind.video.signaling.VideoHandshakeInterceptor;
import com.medifind.video.signaling.VideoSignalingHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;

import java.util.List;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final VideoSignalingHandler videoSignalingHandler;
    private final VideoHandshakeInterceptor videoHandshakeInterceptor;

    @Value("${application.cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(videoSignalingHandler, "/ws/video")
                .addInterceptors(videoHandshakeInterceptor)
                .setAllowedOrigins(origins().toArray(String[]::new));
    }

    /**
     * SDP offers routinely exceed the 8 KB default text buffer once several
     * codecs and ICE candidates are bundled in, so raise the limit.
     */
    @Bean
    public ServletServerContainerFactoryBean createWebSocketContainer() {
        ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();
        container.setMaxTextMessageBufferSize(256 * 1024);
        container.setMaxSessionIdleTimeout(300_000L);
        return container;
    }

    /** Mirrors the CORS origins allowed for the REST API. */
    private List<String> origins() {
        java.util.Set<String> origins = new java.util.LinkedHashSet<>(List.of(allowedOrigins.split(",")));
        origins.add("http://localhost:5173");
        origins.add("https://medifind-five.vercel.app");
        return origins.stream().map(String::trim).filter(o -> !o.isEmpty()).toList();
    }
}
