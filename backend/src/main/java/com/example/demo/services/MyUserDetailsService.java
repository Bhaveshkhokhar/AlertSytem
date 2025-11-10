package com.example.demo.services;

import com.example.demo.model.Admin;
import com.example.demo.model.UserPrincipal;
import com.example.demo.repo.RepoAdmin;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

@Component
public class MyUserDetailsService implements UserDetailsService {

    @Autowired
    private RepoAdmin repoAdmin;
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Admin admin=repoAdmin.findByUserName(username);
        if(admin==null){
System.out.println("Admin 404");
        }
        return new UserPrincipal(admin);
    }
}
