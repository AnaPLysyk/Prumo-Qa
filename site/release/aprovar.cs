// Broker local Windows. Sem flags de aprovação, credenciais em arquivo ou tokens.
using System;
using System.Text;
using System.Runtime.InteropServices;
using System.Security.Principal;
using System.Web.Script.Serialization;
using System.Collections.Generic;

public class PrumoConsent {
 [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
 struct CREDUI_INFO { public int cbSize; public IntPtr hwndParent; public string pszMessageText; public string pszCaptionText; public IntPtr hbmBanner; }
 [DllImport("credui.dll",CharSet=CharSet.Unicode)] static extern int CredUIPromptForCredentialsW(ref CREDUI_INFO info,string target,IntPtr reserved,int error,StringBuilder user,int userMax,StringBuilder password,int passwordMax,ref bool save,int flags);
 [DllImport("advapi32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern bool LogonUser(string user,string domain,string password,int type,int provider,out IntPtr token);
 [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr handle);
 public static string Approve(string message) {
  var info=new CREDUI_INFO(); info.cbSize=Marshal.SizeOf(info); info.pszCaptionText="Prumo QA: autorizar UMA execução"; info.pszMessageText=message;
  var user=new StringBuilder(WindowsIdentity.GetCurrent().Name,513); var password=new StringBuilder(256); bool save=false;
  int result=CredUIPromptForCredentialsW(ref info,"Prumo QA",IntPtr.Zero,0,user,513,password,256,ref save,0x40080|2);
  if(result!=0) throw new InvalidOperationException("CREDUI_ERROR_"+result);
  IntPtr token=IntPtr.Zero;
  try {
   string name=user.ToString(), domain=null; int sep=name.IndexOf('\\');
   if(sep>=0) { domain=name.Substring(0,sep); name=name.Substring(sep+1); }
   if(!LogonUser(name,domain,password.ToString(),2,0,out token)) throw new InvalidOperationException("LOGON_ERROR_"+Marshal.GetLastWin32Error());
   using(var authenticated=new WindowsIdentity(token)) using(var current=WindowsIdentity.GetCurrent()) {
    if(authenticated.User.Value!=current.User.Value) throw new InvalidOperationException("IDENTITY_MISMATCH");
    return current.User.Value;
   }
  } finally { password.Clear(); if(token!=IntPtr.Zero) CloseHandle(token); }
 }
 public static int Main() {
  try {
   Console.InputEncoding=new UTF8Encoding(false);Console.OutputEncoding=new UTF8Encoding(false);
   string input=Console.In.ReadToEnd(); if(input.Length>16384) { Console.Error.WriteLine("INPUT_LIMIT");return 1; }
   var json=new JavaScriptSerializer();var scope=json.Deserialize<Dictionary<string,string>>(input);
   var expires=DateTimeOffset.Parse(scope["expiresAt"]);
   if(DateTimeOffset.UtcNow>expires || expires>DateTimeOffset.UtcNow.AddMinutes(2)) { Console.Error.WriteLine("APPROVAL_EXPIRED");return 1; }
   string message="Projeto: "+scope["projectId"]+"\nRaiz: "+scope["root"]+"\nCapability: "+scope["capability"]+"\nComando: "+scope["command"]+"\nSHA256: "+scope["scopeHash"]+"\nExpira: "+scope["expiresAt"]+"\nDigite sua senha Windows para autorizar. Cancelar bloqueia.";
   string subject=Approve(message);if(DateTimeOffset.UtcNow>expires){Console.Error.WriteLine("APPROVAL_EXPIRED");return 1;}
   Console.WriteLine(json.Serialize(new { subject=subject,method="Windows-CredUI-LogonUser",scopeHash=scope["scopeHash"] }));return 0;
  } catch(Exception e) { Console.Error.WriteLine(e.Message);return 1; }
 }
}
