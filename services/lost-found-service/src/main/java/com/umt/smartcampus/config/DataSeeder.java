package com.umt.smartcampus.config;

import com.umt.smartcampus.models.FoundItemRecord;
import com.umt.smartcampus.models.LostItemReport;
import com.umt.smartcampus.repositories.FoundItemRecordRepository;
import com.umt.smartcampus.repositories.LostItemReportRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedLostFoundData(
            LostItemReportRepository lostItemReportRepository,
            FoundItemRecordRepository foundItemRecordRepository
    ) {
        return args -> {
            seedLostReport(lostItemReportRepository);
            seedFoundRecord(foundItemRecordRepository);
        };
    }

    private void seedLostReport(LostItemReportRepository repository) {
        if (repository.count() > 0) {
            return;
        }

        LostItemReport report = new LostItemReport();
        report.setReporterUserId(2L);
        report.setReporterName("Ahmad Faris");
        report.setReporterEmail("ahmad.faris@umt.edu.my");
        report.setItemName("Laptop Bag");
        report.setDescription("Black Lenovo laptop bag with charger and notes inside.");
        report.setLastKnownLocation("Computer Lab 2");
        report.setPhotoUrls(List.of("https://example.com/lost/laptop-bag.jpg"));
        report.setStatus("OPEN");

        repository.save(report);
    }

    private void seedFoundRecord(FoundItemRecordRepository repository) {
        if (repository.count() > 0) {
            return;
        }

        FoundItemRecord record = new FoundItemRecord();
        record.setSubmittedByUserId(10L);
        record.setSubmittedByName("Security Office");
        record.setSubmittedByRole("SECURITY");
        record.setItemName("Wallet");
        record.setDescription("Brown wallet with student card.");
        record.setFoundLocation("Library entrance");
        record.setPhotoUrls(List.of("https://example.com/found/wallet.jpg"));
        record.setStatus("AVAILABLE");

        repository.save(record);
    }
}
