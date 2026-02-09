import Map "mo:core/Map";
import Set "mo:core/Set";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import Blob "mo:core/Blob";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  module Note {
    public type NoteId = Text;

    public type Note = {
      id : NoteId;
      owner : Principal;
      title : Text;
      content : Text;
      sharedWith : [Principal];
      cryptedSymmetricKey : ?Blob;
    };

    public type NoteSub = {
      id : NoteId;
      owner : Principal;
      title : Text;
      sharedWith : [Principal];
      cryptedSymmetricKey : ?Blob;
    };

    public func compareByTitle(note1 : Note, note2 : Note) : Order.Order {
      Text.compare(note1.title, note2.title);
    };
  };

  module File {
    public type FileId = Text;

    public type File = {
      id : FileId;
      owner : Principal;
      displayName : Text;
      description : Text;
      content : Storage.ExternalBlob;
      sharedWith : [Principal];
      cryptedSymmetricKey : ?Blob;
    };

    public type FileSub = {
      id : FileId;
      owner : Principal;
      displayName : Text;
      description : Text;
      sharedWith : [Principal];
      cryptedSymmetricKey : ?Blob;
    };
  };

  // Shared base type for notes and files for access checking
  public type Sharable = {
    owner : Principal;
    sharedWith : [Principal];
  };

  public type UserProfile = {
    name : Text;
  };

  // Paywall Types
  public type PaywallStatus = {
    hasPaid : Bool;
    planLabel : ?Text;
    paidUntil : ?Nat; // Timestamp in nanoseconds
  };

  public type AdminPaywallStatus = {
    principal : Principal;
    paywallStatus : PaywallStatus;
    totalStorage : Nat;
  };

  let notes = Map.empty<Note.NoteId, Note.Note>();
  let files = Map.empty<File.FileId, File.File>();
  let sharedWithMe = Map.empty<Principal, Set.Set<Text>>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Paywall Storage Using Persistent Map
  let paywallMap = Map.empty<Principal, PaywallStatus>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // Paywall Admin Functions
  public shared ({ caller }) func setPaywallStatus(user : Principal, hasPaid : Bool, planLabel : ?Text, paidUntil : ?Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update paywall status");
    };
    let paywallStatus : PaywallStatus = {
      hasPaid;
      planLabel;
      paidUntil;
    };
    paywallMap.add(user, paywallStatus);
  };

  public query ({ caller }) func getPaywallStatus(_user : Principal) : async PaywallStatus {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view other users` paywall status");
    };
    switch (paywallMap.get(_user)) {
      case (null) {
        Runtime.trap("User not in paywall");
      };
      case (?paywallStatus) {
        paywallStatus;
      };
    };
  };

  public query ({ caller }) func getCallerPaywallStatus() : async PaywallStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access paywall status");
    };
    switch (paywallMap.get(caller)) {
      case (null) {
        Runtime.trap("User not in paywall");
      };
      case (?paywallStatus) {
        paywallStatus;
      };
    };
  };

  // Admin-only query to get all paywall states
  public query ({ caller }) func getAllAdminPaywallStates() : async [AdminPaywallStatus] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can fetch full paywall state list");
    };
    paywallMap.toArray().map(func((principal, status)) { { principal; paywallStatus = status; totalStorage = calculateTotalStorage(principal) } });
  };

  func calculateTotalStorage(principal : Principal) : Nat {
    var totalSize : Nat = 0;
    let values = files.values();
    for (file in values) {
      if (file.owner == principal) { totalSize += file.content.size() };
    };
    totalSize;
  };

  // User profile management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Note operations
  public query ({ caller }) func listNotes() : async [Note.NoteSub] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list notes");
    };
    notes.values()
      .filter(func(note) { hasAccess(caller, note) })
      .map(
        func(note) {
          {
            id = note.id;
            owner = note.owner;
            title = note.title;
            sharedWith = note.sharedWith;
            cryptedSymmetricKey = if (note.owner == caller) {
              note.cryptedSymmetricKey;
            } else { null };
          };
        }
      )
      .toArray();
  };

  public query ({ caller }) func listFiles() : async [File.FileSub] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list files");
    };
    files.values()
      .filter(func(file) { hasAccess(caller, file) })
      .map(
        func(file) {
          {
            id = file.id;
            owner = file.owner;
            displayName = file.displayName;
            description = file.description;
            sharedWith = file.sharedWith;
            cryptedSymmetricKey = if (file.owner == caller) {
              file.cryptedSymmetricKey;
            } else { null };
          };
        }
      )
      .toArray();
  };

  public shared ({ caller }) func createNote(title : Text, content : Text) : async Note.NoteId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create notes");
    };
    checkPaywall(caller);
    let note : Note.Note = {
      id = title;
      owner = caller;
      title;
      content;
      sharedWith = [caller];
      cryptedSymmetricKey = null;
    };
    notes.add(title, note);
    title;
  };

  public query ({ caller }) func readNote(id : Note.NoteId) : async Note.Note {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can read notes");
    };
    let note = notes.get(id);
    switch (note) {
      case (null) { Runtime.trap("Note not found") };
      case (?note) {
        if (not hasAccess(caller, note)) {
          Runtime.trap("Access denied: Not your note nor shared with you");
        };
        note;
      };
    };
  };

  public shared ({ caller }) func updateNote(id : Note.NoteId, title : Text, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update notes");
    };
    let note = notes.get(id);
    switch (note) {
      case (null) { Runtime.trap("Note not found") };
      case (?note) {
        if (caller != note.owner) {
          Runtime.trap("Unauthorized: Only the owner can update the note");
        };
        let updatedNote = {
          id = note.id;
          owner = note.owner;
          title;
          content;
          sharedWith = note.sharedWith;
          cryptedSymmetricKey = note.cryptedSymmetricKey;
        };
        notes.add(id, updatedNote);
      };
    };
  };

  public shared ({ caller }) func deleteNote(id : Note.NoteId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete notes");
    };
    let note = notes.get(id);
    switch (note) {
      case (null) { Runtime.trap("Note not found") };
      case (?note) {
        if (caller != note.owner) {
          Runtime.trap("Unauthorized: Only the owner can delete the note");
        };
        notes.remove(id);
      };
    };
  };

  // File operations
  public shared ({ caller }) func uploadFile(displayName : Text, blob : Storage.ExternalBlob) : async File.FileId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload files");
    };
    checkPaywall(caller);
    let file : File.File = {
      id = displayName;
      owner = caller;
      displayName;
      description = "";
      content = blob;
      sharedWith = [caller];
      cryptedSymmetricKey = null;
    };
    files.add(displayName, file);
    displayName;
  };

  public query ({ caller }) func getFile(id : File.FileId) : async File.File {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can download files");
    };
    let file = files.get(id);
    switch (file) {
      case (null) { Runtime.trap("File not found") };
      case (?file) {
        if (not hasAccess(caller, file)) {
          Runtime.trap("Access denied: Not your file nor shared with you");
        };
        file;
      };
    };
  };

  public shared ({ caller }) func deleteFile(id : File.FileId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete files");
    };
    let file = files.get(id);
    switch (file) {
      case (null) { Runtime.trap("File not found") };
      case (?file) {
        if (caller != file.owner) {
          Runtime.trap("Unauthorized: Only the owner can delete the file");
        };
        files.remove(id);
      };
    };
  };

  public shared ({ caller }) func updateFileMetadata(id : File.FileId, displayName : Text, description : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update file metadata");
    };
    let file = files.get(id);
    switch (file) {
      case (null) { Runtime.trap("File not found") };
      case (?file) {
        if (caller != file.owner) {
          Runtime.trap("Unauthorized: Only the owner can update the file metadata");
        };
        let updatedFile = {
          id = file.id;
          owner = file.owner;
          displayName;
          description;
          content = file.content;
          sharedWith = file.sharedWith;
          cryptedSymmetricKey = file.cryptedSymmetricKey;
        };
        files.add(id, updatedFile);
      };
    };
  };

  // Sharing operations
  public shared ({ caller }) func shareItem(itemType : Text, id : Text, recipient : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can share items");
    };
    switch (itemType) {
      case ("note") {
        switch (notes.get(id)) {
          case (null) { Runtime.trap("Note not found") };
          case (?note) {
            if (caller != note.owner) {
              Runtime.trap("Unauthorized: Only the owner can share the note");
            };
            let updatedNote = {
              id = note.id;
              owner = note.owner;
              title = note.title;
              content = note.content;
              sharedWith = note.sharedWith.concat([recipient]);
              cryptedSymmetricKey = note.cryptedSymmetricKey;
            };
            notes.add(id, updatedNote);
          };
        };
      };
      case ("file") {
        switch (files.get(id)) {
          case (null) { Runtime.trap("File not found") };
          case (?file) {
            if (caller != file.owner) {
              Runtime.trap("Unauthorized: Only the owner can share the file");
            };
            let updatedFile = {
              id = file.id;
              owner = file.owner;
              displayName = file.displayName;
              description = file.description;
              content = file.content;
              sharedWith = file.sharedWith.concat([recipient]);
              cryptedSymmetricKey = file.cryptedSymmetricKey;
            };
            files.add(id, updatedFile);
          };
        };
      };
      case (_) { Runtime.trap("Invalid item type") };
    };
  };

  public shared ({ caller }) func revokeAccess(itemType : Text, id : Text, recipient : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can revoke access");
    };
    switch (itemType) {
      case ("note") {
        switch (notes.get(id)) {
          case (null) { Runtime.trap("Note not found") };
          case (?note) {
            if (caller != note.owner) {
              Runtime.trap("Unauthorized: Only the owner can revoke access");
            };
            let newSharedWith = note.sharedWith.filter(func(p) { p != recipient });
            let updatedNote = {
              id = note.id;
              owner = note.owner;
              title = note.title;
              content = note.content;
              sharedWith = newSharedWith;
              cryptedSymmetricKey = note.cryptedSymmetricKey;
            };
            notes.add(id, updatedNote);
          };
        };
      };
      case ("file") {
        switch (files.get(id)) {
          case (null) { Runtime.trap("File not found") };
          case (?file) {
            if (caller != file.owner) {
              Runtime.trap("Unauthorized: Only the owner can revoke access");
            };
            let newSharedWith = file.sharedWith.filter(func(p) { p != recipient });
            let updatedFile = {
              id = file.id;
              owner = file.owner;
              displayName = file.displayName;
              description = file.description;
              content = file.content;
              sharedWith = newSharedWith;
              cryptedSymmetricKey = file.cryptedSymmetricKey;
            };
            files.add(id, updatedFile);
          };
        };
      };
      case (_) { Runtime.trap("Invalid item type") };
    };
  };

  public query ({ caller }) func getMySharedWithMe() : async [Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view shared items");
    };
    switch (sharedWithMe.get(caller)) {
      case (null) { [] };
      case (?items) { items.toArray() };
    };
  };

  func hasAccess(caller : Principal, sharable : Sharable) : Bool {
    switch (sharable.sharedWith.find(func(p) { p == caller })) {
      case (null) { false };
      case (?_) { true };
    };
  };

  func checkPaywall(caller : Principal) {
    let status = paywallMap.get(caller);
    switch (status) {
      case (null) { Runtime.trap("You need to pay to access storage") };
      case (?paywallStatus) {
        if (not paywallStatus.hasPaid) {
          Runtime.trap("You need to pay to access storage");
        };
        switch (paywallStatus.paidUntil) {
          case (null) {};
          case (?paidUntil) {
            Runtime.trap("Your access has expired");
          };
        };
      };
    };
  };
};
