# Project Tech Stack & Development Guidelines

## 1. Project Overview
**Application:** "IRIS Query Manager"
**Architecture:** Full-Stack Decoupled
**Frontend:** Chrome Extension
**Backend:** InterSystems IRIS Data Platform (ObjectScript)
**Integration Style:** REST API Layer

---

## 2. InterSystems IRIS Backend Guidelines (ObjectScript)

### General Syntax & Style
* **Language:** ObjectScript (native).
* **Naming Conventions:**
    * **Classes/Methods:** CamelCase (e.g., `UpdateLoanStatus`). **NO underscores.**
    * **Parameters:** Must start with `p` (e.g., `pInput`). **NO underscores.**
    * **Local Variables:** Must start with `t` (e.g., `tStatus`).
    * **Macros:** Use `$$$` syntax (e.g., `$$$OK`, `$$$ISERR`).
* **Method Structure:**
    * Always return `%Status` unless a specific return type is required.
    * **Pattern:**
        ```objectscript
        Method MyMethod(pInput As %String) As %Status
        {
            Set tSC = $$$OK
            Try {
                // Logic here
            }
            Catch ex {
                Set tSC = ex.AsStatus()
            }
            Quit tSC
        }
        ```
* **Abstract Methods:** Must have a body with curly braces `{}` and return a value (e.g., `Quit $$$OK` or `Quit ""`), even if abstract.

### REST API Architecture (%CSP.REST)
* **Base Class:** Extend `%CSP.REST`.
* **CORS:** Parameter `HandleCorsRequest = 1` is **MANDATORY** for Angular integration.
* **Payloads:** Use `%DynamicObject` for JSON handling.
* **Routes:** defined in `XData UrlMap`.

### Interoperability Framework
* **Business Services:** Must extend `Ens.BusinessService`.
    * Signature: `OnProcessInput(pInput As %RegisteredObject, Output pOutput As %RegisteredObject, ByRef pHint As %String)`.
* **Business Operations:** Must extend `Ens.BusinessOperation`.
    * Signature: `OnMessage(pRequest As MyReq, Output pResponse As MyResp)`.
* **Adapters:** Explicitly define adapters (e.g., `Parameter ADAPTER = "EnsLib.HTTP.OutboundAdapter"`).

---

## 3. Frontend Guidelines

* Chrome Extension
---

## 4. OjbectScript Testing Guidelines (%UnitTest)

**CRITICAL:** Do NOT use standard xUnit methods. You must use the specific InterSystems macros.

### Test Class Structure
* Extend `%UnitTest.TestCase`.
* **Constructor Requirement:** You MUST implement `%OnNew` exactly as follows if you need setup:
    ```objectscript
    Method %OnNew(initvalue As %String = "") As %Status
    {
        Set tSC = ##super(initvalue)
        If $$$ISERR(tSC) Quit tSC
        // Custom init logic here
        Quit $$$OK
    }
    ```

### ObjectScript Assertions (Macros ONLY)
* **Correct:** `$$$AssertEquals(act, exp, msg)`, `$$$AssertTrue(cond, msg)`, `$$$AssertStatusOK(sc, msg)`.
* **INCORRECT (Do Not Use):** `..AssertEquals`, `$$$AssertFalse`, `$$$AssertCondition`.
* **Note:** These are macros, not methods. Do not use `Do ..Assert...`.

---

## 5. ObjectScript Critical Constraints & "Do Not" Rules

1.  **NO Underscores:** Do not use underscores in Class names, Method names, or Parameter names.
2.  **Try/Catch limitations:** Do NOT use `Quit` with arguments inside a `Try/Catch` block. Set a variable and quit after the catch block.
3.  **Refactoring Limit:** Keep classes under 700 lines. Split logic if it grows too large.
4.  **MultiDimensional:** Do NOT specify a datatype for properties marked `[ MultiDimensional ]`.
    * *Bad:* `Property Data As %String [ MultiDimensional ];`
    * *Good:* `Property Data [ MultiDimensional ];`
5.  **Python:** Do not use `##class(%SYS.Python).IsAvailable()`. It does not exist. Use `Import` then `GetPythonVersion`.