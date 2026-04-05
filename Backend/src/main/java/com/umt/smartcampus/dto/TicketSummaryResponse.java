package com.umt.smartcampus.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TicketSummaryResponse {
    private long total;
    private long open;
    private long inProgress;
    private long resolved;
    private long closed;
}
