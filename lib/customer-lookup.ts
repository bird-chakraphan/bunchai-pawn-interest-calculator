import { phoneNumbersMatch } from "@/lib/phone"
import {
    buildStaffLookupViewModel,
    type PawnRecord,
    type StaffLookupViewModel,
} from "@/lib/staff-lookup"

export type CustomerLookupStatus =
    | "success"
    | "generic_failure"
    | "contact_branch"
    | "rate_limited"

export type CustomerLookupOutcome =
    | {
          status: "success"
          record: PawnRecord
          lookupViewModel: StaffLookupViewModel
      }
    | {
          status: "generic_failure" | "contact_branch" | "rate_limited"
      }

const CUSTOMER_LOOKUP_RATE_LIMIT = 5

export function isCustomerLookupRateLimited(attemptCount: number): boolean {
    return attemptCount >= CUSTOMER_LOOKUP_RATE_LIMIT
}

export function buildCustomerLookupOutcome(params: {
    record: PawnRecord | null
    enteredPhone: string
    currentDate: string
}): CustomerLookupOutcome {
    if (!params.record) {
        return { status: "generic_failure" }
    }

    if (!params.record.customerPhone) {
        return { status: "contact_branch" }
    }

    if (!phoneNumbersMatch(params.record.customerPhone, params.enteredPhone)) {
        return { status: "generic_failure" }
    }

    if (params.record.archivedFromSource) {
        return { status: "contact_branch" }
    }

    return {
        status: "success",
        record: params.record,
        lookupViewModel: buildStaffLookupViewModel({
            record: params.record,
            currentDate: params.currentDate,
        }),
    }
}
