"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Upload, Send, Pencil, Trash2, Check, Edit2, X, ChevronDown, ChevronUp } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ClockIcon, MapPinIcon, BriefcaseIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"; 

import * as XLSX from "xlsx"

interface TableRow {
  id: number
  date: string
  hours: number
  position: string
  location: string
  isEditing: boolean
}
type ExcelRow = [string, number, string, string];

interface Alert {
  type: "'success'" | "'error'"
  message: string
}

type Report = {
  emailFound: boolean;
  databaseHours: { [key: string]: number };
  timesheetHours: { [key: string]: number };
  numberOfDatabaseEntries: number;
  numberOfTimesheetEntries: number;
  invalidEntries: InvalidEntry[];
};

type InvalidEntry = {
  date: string;
  hours: boolean;
  location: boolean;
  position: boolean;
};

const positions = [
  "Back Office", "ISFT Assistant", "ISFT Lead", "PSS", "Special Event",
  "Summer Manager", "Summer Teacher", "Teacher - Assistant", "Teacher - Lead", "Teacher - Online Class"
]

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
};

const StatusBadge = ({ isValid }: { isValid: boolean }) => (
  <Badge variant={isValid ? "outline" : "destructive"} className={isValid ? "bg-green-700 text-white border-green-800" : ""}>
    {isValid ? "Valid" : "Invalid"}
  </Badge>
);

const TimesheetVerificationReport = ({ report }: { report: Report }) => {
  const [isOpen, setIsOpen] = useState(true);
  const entriesMatch = report.numberOfDatabaseEntries === report.numberOfTimesheetEntries;
  const hoursMatch = JSON.stringify(report.databaseHours) === JSON.stringify(report.timesheetHours);
  const hasInvalidEntries = report.invalidEntries.some(entry => !entry.hours || !entry.location || !entry.position);
  const isValid = entriesMatch && hoursMatch && !hasInvalidEntries;

  return (
    <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg border-blue-200 mt-4">
      <CardHeader 
        className="bg-blue-100 dark:bg-blue-900 py-2 cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className="text-blue-800 dark:text-blue-200 text-lg">Timesheet Verification Report</CardTitle>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-blue-700 dark:text-blue-300 font-semibold" style = {{marginTop: "15px"}}>Overall Status:</span>
          <StatusBadge isValid={isValid} />
        </div>
        {isOpen && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="overall-status">
              <AccordionTrigger className="text-blue-700 dark:text-blue-300">Details</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700 dark:text-blue-300">Database Entries:</span>
                    <span>{report.numberOfDatabaseEntries}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700 dark:text-blue-300">Timesheet Entries:</span>
                    <span>{report.numberOfTimesheetEntries}</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="reported-hours">
              <AccordionTrigger className="text-blue-700 dark:text-blue-300">Reported Hours</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1">
                  {Object.entries(report.timesheetHours).map(([role, hours]) => (
                    <div key={role} className="flex justify-between items-center">
                      <span className="text-blue-700 dark:text-blue-300">{role}:</span>
                      <span>
                        Timesheet: {hours}, Database: {report.databaseHours[role] || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {!isValid && (
              <AccordionItem value="verification-results">
                <AccordionTrigger className="text-blue-700 dark:text-blue-300">Invalid Entries</AccordionTrigger>
                <AccordionContent>
                  <Accordion type="single" collapsible className="w-full">
                    {report.invalidEntries.map((entry, index) => (
                      <AccordionItem value={`invalid-entry-${index}`} key={index}>
                        <AccordionTrigger className="text-red-600 dark:text-red-400">
                          {formatDate(entry.date)}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {!entry.hours && (
                              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                                <ClockIcon className="h-4 w-4" />
                                <span>Hours are invalid</span>
                              </div>
                            )}
                            {!entry.location && (
                              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                                <MapPinIcon className="h-4 w-4" />
                                <span>Location is invalid</span>
                              </div>
                            )}
                            {!entry.position && (
                              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                                <BriefcaseIcon className="h-4 w-4" />
                                <span>Position is invalid</span>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export function PandaTsVerify() {
  const [rows, setRows] = useState<TableRow[]>([])
  const [email, setEmail] = useState("")
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [alert, setAlert] = useState<Alert | null>(null)
  const [verificationReport, setVerificationReport] = useState<Report | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail")
    if (storedEmail) setEmail(storedEmail)

    const storedRows = localStorage.getItem("rows")
    console.log("getting storedRows", storedRows)
    if (storedRows) setRows(JSON.parse(storedRows))
  }, [])

  useEffect(() => {
    localStorage.setItem("userEmail", email)
  }, [email])

  useEffect(() => {
    if (rows.length > 0) {
      console.log("setting table rows", rows)
      localStorage.setItem("rows", JSON.stringify(rows))
    }
  }, [rows])
  
  const addRow = () => {
    const newRow: TableRow = {
      id: Date.now(),
      date: new Date().toISOString().split("'T'")[0],
      hours: 0,
      position: "",
      location: "",
      isEditing: true,
    }
    setRows([...rows, newRow])
  }

  const handleInputChange = (id: number, field: keyof TableRow, value: string | number) => {
    setRows(rows.map(row => {
      if (row.id === id) {
        if (field === 'date') {
          // If the date is empty or invalid, use the current date
          const newDate = value ? new Date(value as string) : new Date();
          return { ...row, [field]: newDate.toISOString().split("'T'")[0] };
        } else if (field === 'hours') {
          return { ...row, [field]: value === "" ? 0 : Number(value) };
        } else {
          return { ...row, [field]: value };
        }
      }
      return row;
    }))
  }

  const toggleEdit = (id: number) => {
    setRows(rows.map(row => 
      row.id === id ? { ...row, isEditing: !row.isEditing } : row
    ))
  }

  const deleteRow = (id: number) => {
    setRows(rows.filter(row => row.id !== id))
  }
  
  const isValidDate = (dateInput: string | number | Date): boolean => {
    try {
      const date = parseExcelDate(dateInput);
      return !isNaN(date.getTime());
    } catch {
      return false;
    }
  };

  const parseExcelDate = (excelDate: string | number | Date): Date => {
    let dateObj: Date;
  
    if (excelDate instanceof Date) {
      dateObj = excelDate;
    } else if (typeof excelDate === 'number') {
      // Excel serial date number
      dateObj = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
    } else if (typeof excelDate === 'string') {
      dateObj = new Date(excelDate);
    } else {
      throw new Error('Invalid date format');
    }
  
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date value');
    }
  
    return dateObj;
  };
  

  const handleFiles = (files: FileList) => {
    if (files.length > 0) {
      const file = files[0];
      if (/\.(xls|xlsx)$/i.test(file.name)) {
        const reader = new FileReader();
  
        reader.onload = (e: ProgressEvent<FileReader>) => {
          const data = new Uint8Array(e.target!.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { header: 1 });
          const filteredData = rawData.slice(3).filter(row => {            
            const [date, , role, ] = row;
            console.log(role)
            return role && isValidDate(date);
          }).map(row => {
            const [date, hours, location, role] = row;
            const parsedDate = parseExcelDate(date);
            const formattedDate = parsedDate.toISOString().slice(0, 10);

            return {               
              id: Date.now() + Math.random(),
              date: formattedDate, 
              hours: hours || 0, 
              location: location || "", 
              position: role || "",
              isEditing: false
            };
          });          
          console.log("SETTING ", filteredData)
                             
          setRows(filteredData);
          showAlert("'success'", 'File data loaded successfully');
        };
  
        reader.readAsArrayBuffer(file);
      } else {
        showAlert("'error'", "Please select a valid Excel file (.xls or .xlsx).")
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleFiles(files);
    }
  }

  const sendTableDataToBackend = async () => {
    // const verifyEndpoint = "https://time-verify-backend-4c679305e2eb.herokuapp.com/verify";
    const verifyEndpoint = "http://127.0.0.1:5001/verify";
    
    if (!email) {
      showAlert("'error'", "'Email is required'");
      return;
    }
  
    if (rows.length === 0) {
      showAlert("'error'", "'Timesheet entries are required'");
      return;
    }
  
    try {
      setIsSubmitting(true);
      const tableData = rows.map(({ id, isEditing, ...rest }) => rest);
      console.log("Sending ", tableData);
      const response = await fetch(verifyEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,          
          tableData
        }),        
        credentials: 'include', // If you're using credentials like cookies

      });
  
      const result = await response.json();
  
      if (!response.ok) {
        if (response.status === 404) {          
          showAlert("'error'", result.message || "Resource not found");
        } else if (response.status === 400) {
          showAlert("'error'", result.message || "Bad Request");
        } else if (response.status === 422) {
          showAlert("'error'", result.message || "Unprocessable Entity");
        } else if (response.status === 500) {
          showAlert("'error'", result.message || "Internal Server Error");
        } else {
          showAlert("'error'", result.message || `Unexpected error: ${response.status}`);
        }
        return;
      }
  
      setVerificationReport(result.report);
      showAlert("'success'", "'Data verified successfully'");
    } catch (error) {
      console.error("'Error sending data to backend:'", error);
      showAlert("'error'", "'An error occurred while sending data to the backend'");
    } finally {
      setIsSubmitting(false);
    }
  };

  const showAlert = (type: "'success'" | "'error'", message: string) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 5000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-3xl mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold text-center text-blue-600 dark:text-blue-300">Panda Timesheet Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {alert && (
            <div className={`p-2 rounded-md ${
              alert.type === "'success'" ?
                "'bg-green-100 text-green-800'" : "'bg-red-100 text-red-800'"
            } flex justify-between items-center text-sm`}>
              <span>{alert.message}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAlert(null)}
                className="hover:bg-transparent h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex items-center justify-between">
            {isEditingEmail ? (
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-grow mr-2"
                onBlur={() => setIsEditingEmail(false)}
                autoFocus
              />
            ) : (
              <p className="text-sm font-medium text-blue-600 dark:text-blue-300 flex-grow truncate">
                {email ? `Email: ${email}` : "'No email set'"}
              </p>
            )}
            <Button
              variant="outline"
              onClick={() => setIsEditingEmail(!isEditingEmail)}
              className="bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-700 dark:text-blue-100 dark:hover:bg-blue-600"
              size="sm"
            >
              {isEditingEmail ? (
                <Check className="h-4 w-4" />
              ) : (
                <Edit2 className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex justify-between items-center space-x-2">
            <Button onClick={addRow} variant="outline" className="flex-1 bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-700 dark:text-blue-100 dark:hover:bg-blue-600" size="sm">
              <Plus className="mr-1 h-4 w-4" /> Add Row
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex-1 bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-700 dark:text-blue-100 dark:hover:bg-blue-600" size="sm">
              <Upload className="mr-1 h-4 w-4" /> Upload
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx, .xls"
              className="hidden"
            />
          </div>
          <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-lg shadow max-h-64">
            <div className="overflow-y-auto max-h-64">
              <Table>
                <TableHeader className="sticky top-0 bg-blue-50 dark:bg-gray-800 z-10">
                  <TableRow>
                    <TableHead className="w-[100px] text-blue-600 dark:text-blue-300 text-xs">Date</TableHead>
                    <TableHead className="text-blue-600 dark:text-blue-300 text-xs">Hours</TableHead>
                    <TableHead className="text-blue-600 dark:text-blue-300 text-xs">Position</TableHead>
                    <TableHead className="text-blue-600 dark:text-blue-300 text-xs">Location</TableHead>
                    <TableHead className="w-[80px] text-blue-600 dark:text-blue-300 text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell className="w-[100px] p-2">
                        {row.isEditing ? (
                          <Input
                            type="date"
                            value={row.date}
                            onChange={(e) => handleInputChange(row.id, "date", e.target.value)}
                            className="w-full text-xs"
                            required
                          />
                        ) : (
                          <span className="text-xs">{formatDate(row.date)}</span>
                        )}
                      </TableCell>
                      <TableCell className="p-2">
                        {row.isEditing ? (
                          <Input
                            type="number"
                            value={row.hours === 0 ? "''" : row.hours}
                            onChange={(e) => handleInputChange(row.id, "hours", e.target.value)}
                            step="0.1"
                            className="w-full text-xs"
                            placeholder="0"
                          />
                        ) : (
                          <span className="text-xs">{row.hours}</span>
                        )}
                      </TableCell>
                      <TableCell className="p-2">
                        {row.isEditing ? (
                          <Select 
                            value={row.position} 
                            onValueChange={(value) => handleInputChange(row.id, "position", value)}
                          >
                            <SelectTrigger className="text-xs">
                              <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                            <SelectContent>
                              {positions.map((position) => (
                                <SelectItem key={position} value={position} className="text-xs">
                                  {position}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs">{row.position}</span>
                        )}
                      </TableCell>
                      <TableCell className="p-2">
                        {row.isEditing ? (
                          <Input
                            type="text"
                            value={row.location}
                            onChange={(e) => handleInputChange(row.id, "location", e.target.value)}
                            className="w-full text-xs"
                            placeholder="Enter location"
                          />
                        ) : (
                          <span className="text-xs">{row.location}</span>
                        )}
                      </TableCell>
                      <TableCell className="w-[80px] p-2">
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => toggleEdit(row.id)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 h-6 w-6">
                            {row.isEditing ? <Check className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteRow(row.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 h-6 w-6">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="flex justify-center">
            <Button onClick={sendTableDataToBackend} disabled={isSubmitting} className="w-full max-w-xs bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700" size="sm">
              {isSubmitting ? (
                <>
                  <Send className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit
                </>
              )}
            </Button>
          </div>
          {verificationReport && (
            <TimesheetVerificationReport report={verificationReport} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}