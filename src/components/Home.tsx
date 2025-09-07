/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Trash2, Upload, Send, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Papa from "papaparse";


interface Recipient {
  name: string;
  email: string;
}

export default function EmailCampaignTool() {
  const [recipients, setRecipients] = useState<Recipient[]>([
    { name: "", email: "" },
  ]);
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [failedEmails, setFailedEmails] = useState<string[]>([]);
  const [useGreeting, setUseGreeting] = useState(false);
  const [activeTab, setActiveTab] = useState("compose");

  

  

  const handleRecipientChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newRecipients = [...recipients];
    newRecipients[index][e.target.name as keyof Recipient] = e.target.value;
    setRecipients(newRecipients);
  };

  const addRecipient = () => {
    setRecipients([...recipients, { name: "", email: "" }]);
  };

  const removeRecipient = (index: number) => {
    const newRecipients = recipients.filter((_, i) => i !== index);
    setRecipients(newRecipients);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        parseCSV(text);
      };
      reader.readAsText(file);
    }
  };

  const parseCSV = (text: string) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        const newRecipients: Recipient[] = results.data
          .map((row: any) => ({
            name: row.name || "",
            email: row.email || "",
          }))
          .filter((recipient: Recipient) => recipient.email);

        setRecipients((prev) => [...prev, ...newRecipients]);
        toast.success(`${newRecipients.length} recipients added.`);
      },
      error: function (error: any) {
        console.error("Error parsing CSV:", error);
        toast.error("There was an error parsing the CSV file.");
      },
    });
  };

  const sendEmails = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSending(true);

    setProgress(0);
    setSentCount(0);
    setFailedCount(0);
    setFailedEmails([]);
    setTotalCount(recipients.length);

    try {
      const response = await fetch("/api/sendEmails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderEmail,
          senderName,
          recipients,
          subject,
          text,
          useGreeting,
        }),
      });

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((line) => line.trim() !== "");
          lines.forEach((line) => {
            try {
              const data = JSON.parse(line);
              if (data.status === "success") {
                setSentCount((prev) => prev + 1);
                toast.success(`Email sent to ${data.email}`);
              } else if (data.status === "error") {
                setFailedCount((prev) => prev + 1);
                setFailedEmails((prev) => [...prev, data.email]);
                toast.error(`Failed to send to ${data.email}: ${data.error}`);
              } else if (data.status === "complete") {
                setProgress(100);
                toast.success(
                  `Sent ${data.sent} emails successfully. Failed: ${data.failed}`
                );
                if (data.failed > 0) {
                  toast.error(
                    `Failed to send emails to: ${data.failedEmails.join(", ")}`
                  );
                }
                setSenderEmail("");
                setSenderName("");
                setSubject("");
                setText("");
                setRecipients([{ name: "", email: "" }]);
              }

              setProgress(((sentCount + failedCount) / totalCount) * 100);
            } catch (err) {
              console.error("Error parsing line:", err);
            }
          });
        }
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            BlackAI ⚛ Mail Spoofer
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={sendEmails} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="compose">Compose</TabsTrigger>
                <TabsTrigger value="recipients">Recipients</TabsTrigger>
              </TabsList>
              <TabsContent value="compose" className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="senderEmail">From Email Address</Label>
                  <Input
                    id="senderEmail"
                    type="email"
                    placeholder="Enter sender email address"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senderName">From Name</Label>
                  <Input
                    id="senderName"
                    type="text"
                    placeholder="Enter sender name"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Enter email subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailContent">Email Content</Label>
                  <Textarea
                    id="emailContent"
                    placeholder="Enter your email content..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="min-h-[200px]"
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="useGreeting"
                    checked={useGreeting}
                    onCheckedChange={(checked) =>
                      setUseGreeting(checked as boolean)
                    }
                  />
                  <Label htmlFor="useGreeting">
                    Start email with &quot;Dear [Recipient&apos;s Name]&quot;
                  </Label>
                </div>
              </TabsContent>
              <TabsContent value="recipients" className="space-y-6">
                <div className="space-y-4">
                  {recipients.map((recipient, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex space-x-2"
                    >
                      <Input
                        type="text"
                        name="name"
                        placeholder="Recipient Name"
                        value={recipient.name}
                        onChange={(e) => handleRecipientChange(index, e)}
                        required
                      />
                      <Input
                        type="email"
                        name="email"
                        placeholder="Recipient Email"
                        value={recipient.email}
                        onChange={(e) => handleRecipientChange(index, e)}
                        required
                      />
                      {recipients.length > 1 && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          onClick={() => removeRecipient(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addRecipient}
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Recipient
                  </Button>
                  <div className="relative flex-1">
                    <Input
                      id="csvUpload"
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="cursor-pointer opacity-0 absolute inset-0 w-full h-full"
                    />
                    <Button variant="secondary" className="w-full">
                      <Upload className="h-4 w-4 mr-2" /> Import CSV
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          {isSending && (
            <div className="w-full space-y-2">
              <Progress value={progress} className="w-full" />
              <div className="text-sm text-muted-foreground text-center">
                Sent: {sentCount} | Failed: {failedCount} | Total: {totalCount}
              </div>
            </div>
          )}
          <Button
            type="submit"
            className="w-full"
            onClick={(e) => sendEmails(e as any)}
            disabled={isSending}
          >
            {isSending ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
              />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isSending ? "Sending..." : "Send Email"}
          </Button>
        </CardFooter>
      </Card>
      <ToastContainer position="bottom-right" />
    </div>
  );
}
