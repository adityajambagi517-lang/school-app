export interface AcademicData {
    marks: {
        subject: string;
        examType: string;
        marks: number;
        maxMarks: number;
        percentage: number;
    }[];
    attendance: {
        totalDays: number;
        presentDays: number;
        percentage: number;
    };
    fees: {
        total: number;
        paid: number;
        pending: number;
        pendingAmount: number;
        details: {
            term: string;
            amount: number;
            dueDate: string;
            isPaid: boolean;
        }[];
    };
}

export interface StudentWithDetails {
    _id: string;
    studentId: string;
    name: string;
    email: string;
    dateOfBirth: string;
    gender: string;
    guardianName: string;
    guardianPhone: string;
    address: string;
    classId: {
        className: string;
        section: string;
        academicYear: string;
    };
    academicData: AcademicData;
    profileImage?: string;
    profilePicture?: string;
}
