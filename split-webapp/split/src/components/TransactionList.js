import React from "react";
import {
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelDetails,
  Checkbox,
  FormControlLabel
} from "@material-ui/core";
import EditIcon from "@material-ui/icons/Edit";
import PaymentIcon from "@material-ui/icons/Payment";
import { Link } from "react-router-dom";
import styles from "./TransactionList.module.css";

function calculateTotalPaid(bill) {
  let runningTotal = 0;
  bill.payments.forEach(payment => {
    if (payment.is_paid) {
      runningTotal += payment.amount;
    }
  });

  return runningTotal;
}

function calculateTotalOutstanding(bill) {
  let total = 0;
  bill.payments.forEach(payment => {
    total += payment.amount;
  });

  return total;
}

class TransactionList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      bills: []
    };
  }

  componentDidMount() {
    fetch("/api/bill_data/get_bills")
      .then(res => {
        return res.json();
      })
      .then(data => {
        this.setState({
          bills: data.bills
        });
      })
      .catch(err => {
        console.log(err);
      });
  }

  setPaidStatus(paymentId, paid) {
    const { bills } = this.state;
    this.setState({
      bills: bills.map(bill => {
        return {
          ...bill,
          payments: bill.payments.map(payment => {
            if (payment.payment_id === paymentId) {
              return {
                ...payment,
                is_paid: paid
              };
            }
            return payment;
          })
        };
      })
    });
  }

  populateBills(bills) {
    const transaction = bills.map(bill => (
      <ExpansionPanel className={styles.bills}>
        <ExpansionPanelSummary>
          <div className={styles.billSummary}>
            <div className={styles.billTitle}>{bill.title}</div>
            <div className={styles.billAmount}>
              ${Number(bill.total).toFixed(2)}
            </div>
          </div>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails className={styles.payments}>
          <div className={styles.paymentsTitle}>
            <div className={styles.paymentHeaders}>
              <Link
                to={{
                  pathname: "split",
                  bill
                }}><EditIcon /></Link>
              <PaymentIcon />
            </div>
            <div className={styles.runningTotal}>
              <div className={`${styles.billTitle} ${styles.percentage}`}>
                (
                {Math.round(
                  (calculateTotalPaid(bill) / calculateTotalOutstanding(bill)) *
                    100
                )}
                %){" "}
              </div>
              <div className={styles.billTitle}>
                ${calculateTotalPaid(bill).toFixed(2)}/$
                {calculateTotalOutstanding(bill).toFixed(2)}
              </div>
            </div>
          </div>
          {bill.payments.map(payment => {
            const label = `${payment.from} owes ${payment.to} $${Number(
              payment.amount
            ).toFixed(2)}`;
            return (
              <div key={payment.id}>
                <FormControlLabel
                  aria-label="Acknowledge"
                  onClick={() =>
                    this.markPaid({
                      payment_id: payment.payment_id,
                      is_paid: !payment.is_paid
                    })
                  }
                  onFocus={event => event.stopPropagation()}
                  control={<Checkbox checked={payment.is_paid} />}
                  label={label}
                />
              </div>
            );
          })}
        </ExpansionPanelDetails>
      </ExpansionPanel>
    ));

    if (transaction.length === 0) {
      return (
        <div className={styles.noTransactions}>
          You have no outstanding transactions.
        </div>
      );
    }
    return transaction;
  }

  markPaid(data) {
    fetch("/api/pay_exec/make_payment", {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then(res => {
        this.setPaidStatus(data.payment_id, data.is_paid);
        return res;
      })
      .catch(err => console.log(err));
  }

  render() {
    const { bills } = this.state;
    return <div>{this.populateBills(bills)} </div>;
  }
}

export default TransactionList;
