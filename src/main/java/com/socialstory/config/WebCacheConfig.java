package com.socialstory.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;

@Configuration
public class WebCacheConfig {

    @Bean
    public FilterRegistrationBean<CacheControlFilter> cacheControlFilter() {
        FilterRegistrationBean<CacheControlFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(new CacheControlFilter());
        registrationBean.addUrlPatterns("/css/*", "/js/*", "/stories/cover/*", "/stories/image/*");
        return registrationBean;
    }

    public static class CacheControlFilter implements Filter {
        @Override
        public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
                throws IOException, ServletException {
            HttpServletResponse httpResponse = (HttpServletResponse) response;
            String requestURI = ((HttpServletRequest) request).getRequestURI();

            // Cache static resources for 7 days
            if (requestURI.matches(".*\\.(css|js|png|jpg|jpeg|gif|ico)$")) {
                httpResponse.setHeader("Cache-Control", "max-age=604800, public");
            }
            // Cache images for 7 days
            else if (requestURI.contains("/stories/cover/") || requestURI.contains("/stories/image/")) {
                httpResponse.setHeader("Cache-Control", "max-age=604800, public");
            }

            chain.doFilter(request, response);
        }

        @Override
        public void init(FilterConfig filterConfig) {}

        @Override
        public void destroy() {}
    }
}