package com.umt.smartcampus.config;

import com.umt.smartcampus.models.Ticket;
import com.umt.smartcampus.repositories.TicketRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedTickets(TicketRepository ticketRepository) {
        return args -> {
            seedTicket(
                    ticketRepository,
                    "Wi-Fi dead zone at Library Level 2",
                    "Multiple students cannot connect to campus Wi-Fi in discussion rooms 2A-2C.",
                    "IT Support",
                    "OPEN",
                    "assignee.azman",
                    "Library Level 2",
                    "Aiman Hakim",
                    "aiman.hakim@student.umt.edu.my"
            );
            seedTicket(
                    ticketRepository,
                    "Air conditioner leaking in Lecture Hall B",
                    "Water is dripping from the main AC vent and seats in row 3 are wet.",
                    "Facilities",
                    "IN_PROGRESS",
                    "assignee.farid",
                    "Lecture Hall B",
                    "Siti Nurhaliza",
                    "siti.nurhaliza@student.umt.edu.my"
            );
            seedTicket(
                    ticketRepository,
                    "Projector HDMI not detected in DK1",
                    "Projector powers on but HDMI input is not detected from lecturer laptop.",
                    "Academic",
                    "OPEN",
                    "assignee.hana",
                    "Dewan Kuliah 1",
                    "Muhammad Irfan",
                    "m.irfan@student.umt.edu.my"
            );
            seedTicket(
                    ticketRepository,
                    "Broken door lock at Student Centre restroom",
                    "Restroom door lock is jammed and cannot be secured from inside.",
                    "Maintenance",
                    "RESOLVED",
                    "assignee.nurul",
                    "Student Centre",
                    "Nurul Aisyah",
                    "nurul.aisyah@student.umt.edu.my"
            );
        };
    }

    private void seedTicket(
            TicketRepository ticketRepository,
            String title,
            String description,
            String category,
            String status,
            String assignee,
            String location,
            String requesterName,
            String requesterEmail
    ) {
        if (ticketRepository.existsByTitleIgnoreCase(title)) {
            return;
        }

        Ticket ticket = new Ticket();
        ticket.setTitle(title);
        ticket.setDescription(description);
        ticket.setCategory(category);
        ticket.setStatus(status);
        ticket.setAssignee(assignee);
        ticket.setLocation(location);
        ticket.setRequesterName(requesterName);
        ticket.setRequesterEmail(requesterEmail);
        ticketRepository.save(ticket);
    }
}
